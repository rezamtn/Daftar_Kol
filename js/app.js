  // Simple Persian modal confirm and prompt (Promise-based)
  function confirmFa(message, { okText='تایید', cancelText='انصراف' }={}){
    return new Promise((resolve)=>{
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      // Inline fallback styles to ensure centering even if CSS not loaded
      wrap.style.position = 'fixed';
      wrap.style.inset = '0';
      wrap.style.background = 'rgba(0,0,0,.45)';
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.zIndex = '99999';
      wrap.innerHTML = `
        <div class="modal" style="background:#111a2b; color:#e5ecff; border:1px solid #25324a; border-radius:12px; padding:16px; min-width:260px; max-width:90vw; box-shadow:0 20px 50px rgba(0,0,0,.5); direction:rtl">
          <div class="modal-body">${message}</div>
          <div class="modal-actions" style="display:flex; gap:8px; justify-content:flex-end">
            <button class="btn" data-ok style="background:#16233a; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${okText}</button>
            <button class="btn ghost" data-cancel style="background:transparent; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${cancelText}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const done = (val)=>{ try{ document.body.removeChild(wrap); }catch{} resolve(val); };
      wrap.querySelector('[data-ok]')?.addEventListener('click', ()=> done(true));
      wrap.querySelector('[data-cancel]')?.addEventListener('click', ()=> done(false));
      // do NOT close on overlay click
      wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
    });
  }
  // Strict Persian month addition per product rule
  function addMonthsPersian(iso, m){
    return addMonthsJalali(iso, m);
  }

  // Minimal jalaali-js helpers (MIT) for conversions
  function toJalaali(gy, gm, gd){
    const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
    let jy = 0, jm = 0, jd = 0;
    let gy2 = gy-1600, gm2 = gm-1, gd2 = gd-1;
    let g_day_no = 365*gy2 + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400);
    g_day_no += g_d_m[gm2] + gd2;
    if (gm2>1 && ((gy%4===0 && gy%100!==0) || (gy%400===0))) g_day_no++;
    let j_day_no = g_day_no-79;
    const j_np = Math.floor(j_day_no/12053);
    j_day_no %= 12053;
    jy = 979 + 33*j_np + 4*Math.floor(j_day_no/1461);
    j_day_no %= 1461;
    if (j_day_no >= 366) { jy += Math.floor((j_day_no-366)/365); j_day_no = (j_day_no-366)%365; }
    const jm_list = [31,31,31,31,31,31,30,30,30,30,30,29];
    for (let i=0; i<12 && j_day_no >= jm_list[i]; ++i){ j_day_no -= jm_list[i]; jm++; }
    jm += 1; jd = j_day_no+1;
    return { jy, jm, jd };
  }
  function toGregorian(jy, jm, jd){
    jy -= 979; jm -= 1; jd -= 1;
    let j_day_no = 365*jy + Math.floor(jy/33)*8 + Math.floor(((jy%33)+3)/4);
    for (let i=0; i<jm; ++i) j_day_no += (i<6?31:30);
    j_day_no += jd;
    let g_day_no = j_day_no + 79;
    let gy = 1600 + 400*Math.floor(g_day_no/146097);
    g_day_no %= 146097;
    let leap = true;
    if (g_day_no >= 36525){ g_day_no--; gy += 100*Math.floor(g_day_no/36524); g_day_no %= 36524; if (g_day_no >= 365) g_day_no++; else leap = false; }
    gy += 4*Math.floor(g_day_no/1461); g_day_no %= 1461;
    if (g_day_no >= 366){ leap = false; g_day_no--; gy += Math.floor(g_day_no/365); g_day_no %= 365; }
    const gd_m = [0,31, (leap?29:28),31,30,31,30,31,31,30,31,30,31];
    let gm = 1;
    for (; gm<=12 && g_day_no >= gd_m[gm]; ++gm){ g_day_no -= gd_m[gm]; }
    const gd = g_day_no+1;
    return { gy, gm, gd };
  }
  function jMonthLength(jy, jm){ return jm<=6?31: (jm<=11?30: ( ( ( (jy%33)%4)===1 )?30:29 )); }

  // Add months in Jalali calendar, keeping day-of-month stable when possible
  function addMonthsJalali(iso, m){
    try{
      if(!iso) return '';
      const d = new Date(iso);
      const { jy, jm, jd } = toJalaali(d.getFullYear(), d.getMonth()+1, d.getDate());
      let nm = jm + Number(m||0), ny = jy;
      while(nm>12){ nm-=12; ny+=1; }
      while(nm<1){ nm+=12; ny-=1; }
      const mdays = jMonthLength(ny, nm);
      const nd = Math.min(jd, mdays);
      const g = toGregorian(ny, nm, nd);
      const y = g.gy, mo = String(g.gm).padStart(2,'0'), da = String(g.gd).padStart(2,'0');
      return `${y}-${mo}-${da}`;
    }catch{ return iso; }
  }
  // Expose for external callers (e.g., inline handlers/tests)
  try{ if(typeof window!=='undefined'){ window.openPaymentFormForLoan = openPaymentFormForLoan; } }catch{}
  // Inject a persistent CSS override to ensure datepicker popups stay above modals
  (function dk_injectDatepickerStyle(){
    try{
      if(document.getElementById('dk-datepicker-zfix')) return;
      const css = `
        .vanilla-jdp-container, .vanilla-jdp, .vdp-container, .pwt-datepicker-container, .datepicker-container, .rmdp-wrapper{
          z-index: 1000008 !important;
        }
      `;
      const st = document.createElement('style'); st.id='dk-datepicker-zfix'; st.type='text/css'; st.appendChild(document.createTextNode(css));
      document.head.appendChild(st);
    }catch{}
  })();
  // Create-payment modal (similar to edit, but supports presets)
  function dk_newPaymentModal(loanId, presets){
    return new Promise((resolve)=>{
      try{
        const wrap = document.createElement('div');
        wrap.className = 'modal-wrap';
        wrap.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:99999;';
        wrap.innerHTML = `
          <div class="modal" style="background:#111a2b; color:#e5ecff; border:1px solid #25324a; border-radius:12px; padding:16px; min-width:320px; max-width:92vw; box-shadow:0 20px 50px rgba(0,0,0,.5); direction:rtl; overflow:visible">
            <div style="font-weight:800; margin-bottom:10px">افزودن پرداخت</div>
            <div class="dk-form-grid-2col">
              <label class="dk-form-label">مبلغ</label>
              <input id="np-amt" inputmode="numeric" class="dk-form-control-rtl" />
              <label class="dk-form-label">نوع</label>
              <select id="np-type" class="dk-form-control-rtl">
                <option value="interest" selected>سود</option>
                <option value="principal">اصل</option>
              </select>
              <label class="dk-form-label">تاریخ</label>
              <div class="dk-form-control-row">
                <input id="np-date-fa" readonly class="dk-form-control-rtl" style="flex:1" placeholder="تاریخ شمسی" />
                <input id="np-date-iso" type="hidden" />
              </div>
              <label class="dk-form-label">یادداشت</label>
              <textarea id="np-note" rows="2" class="dk-form-control-rtl" style="resize:none; overflow:hidden"></textarea>
            </div>
            <div id="np-err" class="small" style="color:#fb7185; min-height:18px; margin-top:8px"></div>
            <div class="modal-actions" style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px">
              <button id="np-ok" class="btn">افزودن</button>
              <button id="np-cancel" class="btn ghost">انصراف</button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        // Auto-expand note textarea to show full content
        try{
          const ta = wrap.querySelector('#np-note');
          const autoresize = ()=>{ try{ ta.style.height='auto'; ta.style.height = (ta.scrollHeight)+'px'; }catch{} };
          if(ta){ ta.addEventListener('input', autoresize); setTimeout(autoresize, 0); }
        }catch{}
        const done = (val)=>{ try{ document.body.removeChild(wrap); }catch{} resolve(val); };
        wrap.querySelector('#np-cancel')?.addEventListener('click', ()=> done(null));
        // Amount formatting fa-IR with thousands separators
        try{
          const inpAmt = wrap.querySelector('#np-amt');
          const toFa = (s)=> (typeof vj_toFaDigits==='function'? vj_toFaDigits(String(s)) : String(s));
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const nfFa = (typeof Intl!=='undefined' && Intl.NumberFormat) ? new Intl.NumberFormat('fa-IR') : null;
          // Prefill amount if provided
          try{
            if(presets && Number(presets.defaultAmount)>0){
              const n = Math.round(Number(presets.defaultAmount));
              inpAmt.value = nfFa ? nfFa.format(n) : toFa(String(n));
            }
          }catch{}
          inpAmt.addEventListener('input', ()=>{
            const ascii = toAscii(inpAmt.value).replace(/[^0-9]/g,'');
            if(!ascii){ inpAmt.value=''; return; }
            const n = Number(ascii);
            inpAmt.value = nfFa ? nfFa.format(n) : toFa(ascii);
          });
        }catch{}
        // Datepicker: default today in Jalali
        try{
          const isoEl = wrap.querySelector('#np-date-iso');
          const faEl = wrap.querySelector('#np-date-fa');
          // Pre-fill today using existing helper (initVanillaJdp will set today if prefillToday:true)
          if(typeof initVanillaJdp==='function') initVanillaJdp('#np-date-fa', '#np-date-iso', null, { prefillToday:true, dashWhenEmpty:false, zIndex: 1000005 });
          try{ dk_liftDatepickers(); faEl.addEventListener('focus', ()=> setTimeout(()=> dk_liftDatepickers(), 0)); faEl.addEventListener('click', ()=> setTimeout(()=> dk_liftDatepickers(), 0)); }catch{}
          // Ensure ISO has a value even if user doesn't touch the field
          try{
            const iso = (presets && presets.defaultDateISO) ? String(presets.defaultDateISO) : '';
            const isoEl2 = document.querySelector('#np-date-iso');
            if(isoEl2){ isoEl2.value = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : (isoEl2.value || new Date().toISOString().slice(0,10)); }
          }catch{}
        }catch{}
        // Prefill type if provided
        try{ if(presets && presets.defaultType){ const tSel = wrap.querySelector('#np-type'); if(tSel){ tSel.value = presets.defaultType; } } }catch{}
        wrap.querySelector('#np-ok')?.addEventListener('click', ()=>{
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const amt = toAscii(wrap.querySelector('#np-amt').value.trim()).replace(/[^0-9]/g,'');
          const type = wrap.querySelector('#np-type').value.trim();
          const date = String(wrap.querySelector('#np-date-iso').value||'').trim();
          const note = wrap.querySelector('#np-note').value.trim();
          // validation
          const errEl = wrap.querySelector('#np-err');
          const isValidType = (type==='interest' || type==='principal');
          const isValidAmt = (/^\d+$/.test(amt) && Number(amt)>0);
          const isValidISO = (/^\d{4}-\d{2}-\d{2}$/.test(date));
          if(!isValidAmt){ errEl.textContent='مبلغ نامعتبر است.'; return; }
          if(!isValidType){ errEl.textContent='نوع پرداخت را انتخاب کنید.'; return; }
          if(!isValidISO){ errEl.textContent='تاریخ نامعتبر است.'; return; }
          errEl.textContent='';
          done({ amount: amt, type, date, note });
        });
        wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
      }catch{ resolve(null); }
    });
  }

  // Show payments history modal with optional filter: 'all' | 'interest' | 'principal'
  async function dk_showPaysHistoryModal(loanId, filter){
    try{
      const paysAll = Array.isArray(state?.pays)? state.pays : [];
      let list = paysAll.filter(p=> p.loanId===loanId);
      if(filter==='interest') list = list.filter(p=> String(p.type||'')==='interest');
      if(filter==='principal') list = list.filter(p=> String(p.type||'')==='principal');
      let body = '';
      const fmt = (n)=>{ try{ return Number(n||0).toLocaleString('fa-IR'); }catch{ return String(n||0); } };
      // Loan principal and remaining principal (principal - sum(principal payments))
      let principalInit = 0, principalPaidAll = 0, principalRemain = 0;
      try{
        const loan = (Array.isArray(state?.loans)? state.loans:[]).find(l=> String(l.id)===String(loanId));
        const toNum = (v)=>{ try{ const s=String(v??''); const cleaned=s.replace(/[^0-9.\-]/g,''); const n=Number(cleaned); return Number.isFinite(n)? n:0; }catch{ return Number(v)||0; } };
        principalInit = toNum(loan?.principal);
        principalPaidAll = (Array.isArray(state?.pays)? state.pays:[])
          .filter(p=> p.loanId===loanId && String(p.type||'')==='principal')
          .reduce((a,p)=> a + toNum(p.amount), 0);
        principalRemain = Math.max(0, principalInit - principalPaidAll);
      }catch{}
      const mkToolbar = ()=>{
        const on = (k)=> filter===k ? ' style="outline:2px solid rgba(167,139,250,.6)" ' : '';
        const chip = (k, label)=> `<button class="btn small ghost" ${on(k)} onclick="try{ window.dkShowPaysHistory('${loanId}','${k}'); }catch{}">${label}</button>`;
        const addBtn = `<button class="btn small" style="margin-inline-start:auto" onclick="try{ window.dk_addNewPayment('${loanId}'); }catch{}">➕ افزودن پرداخت جدید</button>`;
        return `<div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; width:100%">${chip('all','همه')} ${chip('interest','فقط سود')} ${chip('principal','فقط اصل')} ${addBtn}</div>`;
      };
    // Ensure external modules (EditCard) can invoke the exact same editor logic
    try{ window.enterEditMode = enterEditMode; }catch{}
    // Make the core loan editor callable from external modules (EditCard)
    try{ window.enterEditMode = enterEditMode; }catch{}
    // Expose editor so external modules (EditCard) can trigger the exact same behavior
    try{ window.enterEditMode = enterEditMode; }catch{}
      if(list.length===0){
        body = mkToolbar() + '<div class="small" style="opacity:.8">— پرداختی مطابق فیلتر یافت نشد —</div>';
      }else{
        list.sort((a,b)=> String(b.date||'').localeCompare(String(a.date||'')));
        const sum = (arr, pred)=> arr.filter(pred).reduce((a,p)=> a + Number(p.amount||0), 0);
        const sumInt = sum(list, p=> String(p.type||'')==='interest');
        // Show remaining principal instead of just sum of principals
        const summary = `
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; width:100%">
            <span class="badge" style="background:rgba(34,197,94,.18); color:#bbf7d0; border:1px solid rgba(34,197,94,.45); padding:6px 10px; border-radius:999px">سود کل: ${fmt(sumInt)} تومان</span>
            <span class="badge" title="${toFaDigits(String(principalInit))} − ${toFaDigits(String(principalPaidAll))}" style="background:rgba(59,130,246,.18); color:#dbeafe; border:1px solid rgba(59,130,246,.45); padding:6px 10px; border-radius:999px">مانده اصل: ${fmt(principalRemain)} تومان</span>
            <span class="badge" style="background:rgba(148,163,184,.18); color:#e2e8f0; border:1px solid rgba(148,163,184,.45); padding:6px 10px; border-radius:999px">تعداد: ${toFaDigits(String(list.length))}</span>
          </div>`;
        const groups = {};
        list.forEach(p=>{ const k=String(p.date||''); (groups[k]||(groups[k]=[])).push(p); });
        const rows = Object.keys(groups).sort((a,b)=> b.localeCompare(a)).map(iso=>{
          const when = (typeof dk_bothDatesHTML==='function')? dk_bothDatesHTML(iso) : (typeof window._bothDatesHTML==='function'? window._bothDatesHTML(iso): iso);
          const items = groups[iso].map((p, j)=>{
            const amt = fmt(p.amount);
            const kind = (String(p.type||'')==='principal')? 'اصل' : 'سود';
            const color = (kind==='اصل')? 'rgba(59,130,246,.22)' : 'rgba(167,139,250,.22)';
            const border = (kind==='اصل')? 'rgba(59,130,246,.45)' : 'rgba(167,139,250,.45)';
            const note = (p.note||'').trim();
            // robust edit handle: prefer payment id, else use global index in state.pays
            let clickEdit = '';
            let clickDel = '';
            try{
              const paysAll = Array.isArray(state?.pays)? state.pays:[];
              const gid = (p && p.id!=null) ? String(p.id) : '';
              if(gid){ clickEdit = `window.dkEditPayment('${gid}')`; }
              else{
                const gidx = paysAll.findIndex(q=> q===p);
                clickEdit = `window.dkEditPaymentByIndex(${gidx})`;
              }
              if(gid){ clickDel = `window.dkDeletePayment('${gid}')`; }
              else{
                const gidx = paysAll.findIndex(q=> q===p);
                clickDel = `window.dkDeletePaymentByIndex(${gidx})`;
              }
            }catch{ clickEdit = `window.dkEditPayment('${p?.id||''}')`; }
            return `
              <div style="background:${color}; border:1px solid ${border}; border-radius:12px; padding:10px; display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; min-width:0">
                <div style="display:flex; align-items:center; gap:8px">
                  <div style="font-weight:800">${kind}</div>
                  <button class=\"btn small\" onclick=\"try{ ${clickEdit}; }catch{}\">✏️ ویرایش</button>
                  <button class=\"btn small ghost\" onclick=\"try{ ${clickDel}; }catch{}\" title=\"حذف\">🗑️ حذف</button>
                </div>
                <div style="text-align:center; line-height:1.1">
                  <div style="font-weight:800; font-size:16px">${amt}</div>
                  <div class="small" style="opacity:.85">تومان</div>
                </div>
              </div>
              ${note? `<div class="small" style="opacity:.85; margin-top:6px">یادداشت: ${note.replace(/\n/g,'<br>')}</div>`:''}
            `;
          }).join('');
          return `
            <div style="border:1px solid #2b364d; border-radius:12px; padding:10px; background:linear-gradient(180deg,#0f1522,#0e1a2e); box-shadow:0 10px 24px rgba(0,0,0,.25); width:100%; grid-column:1 / -1">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                <div class="muted">${when}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:8px; width:100%">
                ${items}
              </div>
            </div>`;
        }).join('<div style="height:10px"></div>');
        body = `<div style="display:flex; flex-direction:column; gap:12px; width:100%; grid-column:1 / -1">${mkToolbar()}${summary}<div style=\"max-height:60vh; overflow:auto; width:100%; grid-column:1 / -1\">${rows}</div></div>`;
      }
      await infoFa('تاریخچه پرداخت', body, { okText:'بستن' });
    }catch{}
  }
  // Expose for external callers (console/tests/buttons)
  try{ if(typeof window!== 'undefined'){ window.openPaymentFormForLoan = openPaymentFormForLoan; } }catch{}
  try{ if(typeof window!=='undefined'){ window.dkShowPaysHistory = dk_showPaysHistoryModal; } }catch{}
  // Lightweight edit modal for a payment
  function dk_editPaymentModal(p){
    return new Promise((resolve)=>{
      try{
        const wrap = document.createElement('div');
        wrap.className = 'modal-wrap';
        wrap.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:99999;';
        wrap.innerHTML = `
          <div class=\"modal\" style=\"background:#111a2b; color:#e5ecff; border:1px solid #25324a; border-radius:12px; padding:16px; min-width:320px; max-width:92vw; box-shadow:0 20px 50px rgba(0,0,0,.5); direction:rtl; overflow:visible\">
            <div style=\"font-weight:800; margin-bottom:10px\">ویرایش پرداخت</div>
            <div style=\"display:grid; grid-template-columns: 100px 1fr; gap:8px 10px;\">
              <label>مبلغ</label><input id=\"ep-amt\" inputmode=\"numeric\" style=\"background:#0f1522; color:#e5ecff; border:1px solid #2b364d; border-radius:8px; padding:6px 8px\" />
              <label>نوع</label>
              <select id=\"ep-type\" style=\"background:#0f1522; color:#e5ecff; border:1px solid #2b364d; border-radius:8px; padding:6px 8px\">
                <option value=\"interest\" ${String(p.type||'interest')==='interest'?'selected':''}>سود</option>
                <option value=\"principal\" ${String(p.type||'')==='principal'?'selected':''}>اصل</option>
              </select>
              <label>تاریخ</label>
              <div style=\"display:flex; gap:6px; align-items:center\">
                <input id=\"ep-date-fa\" readonly style=\"flex:1; background:#0f1522; color:#e5ecff; border:1px solid #2b364d; border-radius:8px; padding:6px 8px\" placeholder=\"تاریخ شمسی\" />
                <input id=\"ep-date-iso\" type=\"hidden\" />
              </div>
              <label>یادداشت</label><textarea id=\"ep-note\" rows=\"3\" style=\"background:#0f1522; color:#e5ecff; border:1px solid #2b364d; border-radius:8px; padding:6px 8px\">${String(p.note||'')}</textarea>
            </div>
            <div class=\"modal-actions\" style=\"display:flex; gap:8px; justify-content:flex-end; margin-top:12px\">
              <button id=\"ep-ok\" class=\"btn\">ذخیره</button>
              <button id=\"ep-cancel\" class=\"btn ghost\">انصراف</button>
            </div>
          </div>`;
        document.body.appendChild(wrap);
        const done = (val)=>{ try{ document.body.removeChild(wrap); }catch{} resolve(val); };
        wrap.querySelector('#ep-cancel')?.addEventListener('click', ()=> done(null));
        // Prefill amount with Persian digits + thousands separator, and keep formatted while typing
        try{
          const inpAmt = wrap.querySelector('#ep-amt');
          const toFa = (s)=> (typeof vj_toFaDigits==='function'? vj_toFaDigits(String(s)) : String(s));
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const nfFa = (typeof Intl!=='undefined' && Intl.NumberFormat) ? new Intl.NumberFormat('fa-IR') : null;
          const initAscii = String(toAscii(p.amount||'')).replace(/[^0-9]/g,'');
          inpAmt.value = initAscii ? (nfFa? nfFa.format(Number(initAscii)) : toFa(initAscii)) : '';
          inpAmt.addEventListener('input', ()=>{
            const ascii = toAscii(inpAmt.value).replace(/[^0-9]/g,'');
            if(!ascii){ inpAmt.value=''; return; }
            const n = Number(ascii);
            inpAmt.value = nfFa ? nfFa.format(n) : toFa(ascii);
          });
        }catch{}
        // Prefill and attach Jalali datepicker
        try{
          const isoEl = wrap.querySelector('#ep-date-iso');
          const faEl = wrap.querySelector('#ep-date-fa');
          isoEl.value = String(p.date||'');
          // If we have ISO, render a FA date in the visible input
          try{
            const m = String(isoEl.value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if(m){
              const gy=parseInt(m[1],10), gm=parseInt(m[2],10), gd=parseInt(m[3],10);
              const j = vj_d2j(vj_g2d(gy,gm,gd));
              if(j && typeof fmtJalaliYMD==='function') faEl.value = fmtJalaliYMD(j[0], j[1], j[2], true);
            }
          }catch{}
          if(typeof initVanillaJdp==='function') initVanillaJdp('#ep-date-fa', '#ep-date-iso', null, { prefillToday:false, dashWhenEmpty:true, zIndex: 1000005 });
          try{ dk_liftDatepickers(); faEl.addEventListener('focus', ()=> setTimeout(()=> dk_liftDatepickers(), 0)); faEl.addEventListener('click', ()=> setTimeout(()=> dk_liftDatepickers(), 0)); }catch{}
          // Ensure ISO has a value to pass validation when user doesn't change date
          if(!isoEl.value){ try{ isoEl.value = new Date().toISOString().slice(0,10); }catch{} }
        }catch{}
        wrap.querySelector('#ep-ok')?.addEventListener('click', ()=>{
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const amt = toAscii(wrap.querySelector('#ep-amt').value.trim()).replace(/[^0-9]/g,'');
          const type = wrap.querySelector('#ep-type').value.trim();
          const date = String(wrap.querySelector('#ep-date-iso').value||'').trim();
          const note = wrap.querySelector('#ep-note').value.trim();
          done({ amount: amt, type, date, note });
        });
        wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
      }catch{ resolve(null); }
    });
  }
  async function dk_editPayment(paymentId){
    try{
      const pays = Array.isArray(state?.pays)? state.pays:[];
      const idx = pays.findIndex(x=> String(x.id)===String(paymentId));
      const p = idx>=0 ? pays[idx] : null; if(!p) return;
      const loanId = p.loanId;
      const vals = await dk_editPaymentModal(p);
      if(!vals) return;
      // Normalize and persist clean values
      const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
      const toNum = (s)=>{ const ascii = toAscii(s).replace(/[^0-9]/g,''); return Number(ascii)||0; };
      const before = { amount:p.amount, type:p.type, date:p.date, note:p.note };
      const after  = { amount: toNum(vals.amount), type: vals.type, date: vals.date, note: vals.note };
      // replace object to help any shallow comparisons
      pays[idx] = Object.assign({}, p, after);
      try{ state.pays = pays.slice(); }catch{}
      try{ console.log('[DK][editPay] byId', paymentId, 'before:', before, 'after:', after); }catch{}
      try{ refreshPaysTable && refreshPaysTable(); }catch{}
      try{ refreshLoansTable && refreshLoansTable(); }catch{}
      try{ refreshLoansCards && refreshLoansCards(); }catch{}
      // Close any existing modals to avoid stacking, then reopen fresh history
      try{ if(typeof dk_closeAllModals==='function') dk_closeAllModals(); }catch{}
      try{ dk_showPaysHistoryModal(loanId, 'all'); }catch{}
    }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dkEditPayment = dk_editPayment; } }catch{}
  // Fallback editor when an item has no persistent id: edit by array index
  async function dk_editPaymentByIndex(idx){
    try{
      const pays = Array.isArray(state?.pays)? state.pays:[];
      if(idx==null || idx<0 || idx>=pays.length) return;
      const p = pays[idx]; if(!p) return;
      const loanId = p.loanId;
      const vals = await dk_editPaymentModal(p);
      if(!vals) return;
      const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
      const toNum = (s)=>{ const ascii = toAscii(s).replace(/[^0-9]/g,''); return Number(ascii)||0; };
      const before = { amount:p.amount, type:p.type, date:p.date, note:p.note };
      const after  = { amount: toNum(vals.amount), type: vals.type, date: vals.date, note: vals.note };
      pays[idx] = Object.assign({}, p, after);
      try{ console.log('[DK][editPay] byIndex', idx, 'before:', before, 'after:', after); }catch{}
      try{ refreshPaysTable && refreshPaysTable(); }catch{}
      try{ refreshLoansTable && refreshLoansTable(); }catch{}
      try{ refreshLoansCards && refreshLoansCards(); }catch{}
      try{ dk_showPaysHistoryModal(loanId, 'all'); }catch{}
    }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dkEditPaymentByIndex = dk_editPaymentByIndex; } }catch{}
  // Delete payment by id
  async function dkDeletePayment(paymentId){
    try{
      const pays = Array.isArray(state?.pays)? state.pays:[];
      const idx = pays.findIndex(x=> String(x.id)===String(paymentId));
      if(idx<0) return;
      const loanId = pays[idx]?.loanId;
      // Unified delete modal via Delete.ask
      let ok = false;
      try{ ok = await (window.Delete?.ask ? window.Delete.ask('این پرداخت') : confirmFa('این پرداخت حذف شود؟')); }catch{ ok = true; }
      if(!ok) { try{ console.log('[DK][delPay] cancelled'); }catch{} return; }
      try{ console.log('[DK][delPay] deleting id', paymentId); }catch{}
      pays.splice(idx,1);
      try{ state.pays = pays.slice(); }catch{}
      try{ refreshPaysTable && refreshPaysTable(); }catch{}
      try{ refreshLoansTable && refreshLoansTable(); }catch{}
      try{ refreshLoansCards && refreshLoansCards(); }catch{}
      try{ dk_closeAllModals && dk_closeAllModals(); }catch{}
      try{ dk_showPaysHistoryModal(loanId, 'all'); }catch{}
    }catch{}
  }
  // Delete payment by array index (when no id)
  async function dkDeletePaymentByIndex(idx){
    try{
      const pays = Array.isArray(state?.pays)? state.pays:[];
      if(idx==null || idx<0 || idx>=pays.length) return;
      const loanId = pays[idx]?.loanId;
      // Unified delete modal via Delete.ask
      let ok = false;
      try{ ok = await (window.Delete?.ask ? window.Delete.ask('این پرداخت') : confirmFa('این پرداخت حذف شود؟')); }catch{ ok = true; }
      if(!ok) { try{ console.log('[DK][delPay] cancelled'); }catch{} return; }
      try{ console.log('[DK][delPay] deleting index', idx); }catch{}
      pays.splice(idx,1);
      try{ state.pays = pays.slice(); }catch{}
      try{ refreshPaysTable && refreshPaysTable(); }catch{}
      try{ refreshLoansTable && refreshLoansTable(); }catch{}
      try{ refreshLoansCards && refreshLoansCards(); }catch{}
      try{ dk_closeAllModals && dk_closeAllModals(); }catch{}
      try{ dk_showPaysHistoryModal(loanId, 'all'); }catch{}
    }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dkDeletePayment = dkDeletePayment; } }catch{}
  try{ if(typeof window!=='undefined'){ window.dkDeletePaymentByIndex = dkDeletePaymentByIndex; } }catch{}
  // Utility: close all app modals to prevent stacking
  function dk_closeAllModals(){
    try{ document.querySelectorAll('.modal-wrap').forEach(el=>{ try{ el.remove(); }catch{} }); }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dk_closeAllModals = dk_closeAllModals; } }catch{}
  // Lift any common datepicker containers above modals and append to body to avoid clipping
  function dk_liftDatepickers(){
    try{
      const focusEl = document.activeElement;
      const rect = focusEl && focusEl.getBoundingClientRect ? focusEl.getBoundingClientRect() : null;
      const sels = ['.vjal-pop', '.vanilla-jdp-container', '.vanilla-jdp', '.vdp-container', '.pwt-datepicker-container', '.datepicker-container', '.rmdp-wrapper'];
      const els = sels.flatMap(sel=> Array.from(document.querySelectorAll(sel)));
      els.forEach(el=>{
        try{
          // Move to body to escape clipping/stacking contexts
          if(el.parentElement !== document.body){ document.body.appendChild(el); }
          // Elevate above modal
          el.style.zIndex = '1000010';
          el.style.position = 'fixed';
          el.style.pointerEvents = 'auto';
          el.style.transform = 'translateZ(0)';
          if(rect){
            // Default place below input
            let left = Math.max(8, Math.min(window.innerWidth - 8, rect.left));
            // Measure height (after appended)
            const h = (el.offsetHeight && el.offsetHeight > 0) ? el.offsetHeight : 300;
            let top = rect.bottom + 6;
            // If going out of viewport bottom, place above input
            if(top + h + 8 > window.innerHeight){
              top = Math.max(8, rect.top - h - 6);
            }
            // Clamp into viewport
            left = Math.max(8, Math.min(window.innerWidth - 8, left));
            top = Math.max(8, Math.min(window.innerHeight - 8, top));
            el.style.left = left + 'px';
            el.style.top = top + 'px';
          }
        }catch{}
      });
      // Run again shortly in case the picker renders async sizes
      setTimeout(()=>{
        try{ els.forEach(el=>{ try{ if(document.body.contains(el)){ /* recompute with actual height */
          const focusEl2 = document.activeElement; const rect2 = focusEl2?.getBoundingClientRect?.(); if(!rect2) return;
          const h = (el.offsetHeight && el.offsetHeight > 0) ? el.offsetHeight : 300;
          let top = rect2.bottom + 6; if(top + h + 8 > window.innerHeight){ top = Math.max(8, rect2.top - h - 6); }
          let left = Math.max(8, Math.min(window.innerWidth - 8, rect2.left));
          left = Math.max(8, Math.min(window.innerWidth - 8, left));
          top = Math.max(8, Math.min(window.innerHeight - 8, top));
          el.style.top = top + 'px'; el.style.left = left + 'px';
          el.style.zIndex = '1000010'; el.style.position='fixed';
        } }catch{} }); }catch{}
      }, 30);
    }catch{}
  }
  // Open add-payment form visibly from history toolbar
  function dk_addNewPayment(loanId){
    try{
      // Inline create modal (keeps history modal open beneath)
      dk_newPaymentModal(loanId).then((vals)=>{
        if(!vals) return;
        try{
          const pays = Array.isArray(state?.pays)? state.pays:[];
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const toNum = (s)=>{ const ascii = toAscii(s).replace(/[^0-9]/g,''); return Number(ascii)||0; };
          const genId = ()=> `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
          const u = (typeof getCurrentUser==='function')? (getCurrentUser()||{}) : {};
          const pay = {
            id: genId(),
            loanId: loanId,
            type: vals.type,
            amount: toNum(vals.amount),
            date: vals.date, // ISO
            note: vals.note||'',
            createdBy: u.uid||'',
            createdAt: new Date().toISOString()
          };
          pays.push(pay);
          try{ state.pays = pays.slice(); }catch{}
          try{ console.log('[DK][newPay] added', pay); }catch{}
          try{ refreshPaysTable && refreshPaysTable(); }catch{}
          try{ refreshLoansTable && refreshLoansTable(); }catch{}
          try{ refreshLoansCards && refreshLoansCards(); }catch{}
          // Refresh history modal content to include the new record (avoid stacking)
          try{ if(typeof dk_closeAllModals==='function') dk_closeAllModals(); }catch{}
          try{ dk_showPaysHistoryModal(loanId, 'all'); }catch{}
        }catch{}
      });
    }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dk_addNewPayment = dk_addNewPayment; } }catch{}
  // Quick interest payment flow for Resolve: compute default amount and open modal prefilled
  function dk_quickAddInterestPayment(loanId){
    try{
      const loan = (Array.isArray(state?.loans)? state.loans:[]).find(l=> String(l.id)===String(loanId));
      if(!loan) return;
      const d = (function(){ try{ return computeLoanDerived(loan)||{}; }catch{ return {}; } })();
      let amt = 0;
      try{ amt = Number(d.expectedPayoutByMode||0) || Number(d.cycleInterest||0) || 0; }catch{}
      // If derived amount is zero (e.g., due to Persian digits in inputs), compute robustly here
      if(!(Number(amt)>0)){
        try{
          const normalizeDigitsLocal = (s)=>{
            try{
              return String(s)
                .replace(/[\u06F0-\u06F9]/g, (d)=> String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                .replace(/[\u0660-\u0669]/g, (d)=> String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                .replace(/،/g, ',');
            }catch{ return String(s); }
          };
          const toAscii = (s)=>{ try{ const f = (typeof vj_normalizeDigits==='function')? vj_normalizeDigits : normalizeDigitsLocal; return f(String(s)); }catch{ return normalizeDigitsLocal(String(s)); } };
          const toNum = (v)=>{ try{ const s = toAscii(v); const cleaned = s.replace(/[^0-9.\-]/g,''); const n = Number(cleaned.replace(/,/g,'')); return Number.isFinite(n)? n:0; }catch{ return Number(v)||0; } };
          const pays = Array.isArray(state?.pays)? state.pays:[];
          const principalPaid = pays.filter(p=> String(p.loanId)===String(loan.id) && String(p.type)==='principal').reduce((a,p)=> a + toNum(p.amount), 0);
          const principal = toNum(loan.principal);
          let balance = Math.max(0, principal - principalPaid);
          // If balance computed 0 unexpectedly, fall back to full principal for interest calc
          if(!(balance>0)) balance = principal;
          const monthlyRate = toNum(loan.rateMonthlyPct)/100;
          const modeVal = parseInt(String(toNum(loan.interestPayoutMode)||1),10) || 1; // 0..3
          const k = modeVal===0 ? (parseInt(String(toNum(loan.interestEveryMonths)||0),10)||0) : modeVal;
          const calc = Math.round(balance * monthlyRate * (k||1));
          if(calc>0) amt = calc;
        }catch{}
      }
      const presets = { defaultType:'interest', defaultAmount: amt, defaultDateISO: new Date().toISOString().slice(0,10) };
      try{ console.log('[DK][quickPay] computed defaults', { loanId, amount: amt }); }catch{}
      dk_newPaymentModal(loanId, presets).then((vals)=>{
        if(!vals) return;
        try{
          const pays = Array.isArray(state?.pays)? state.pays:[];
          const toAscii = (s)=> (typeof vj_normalizeDigits==='function'? vj_normalizeDigits(String(s)) : String(s));
          const toNum = (s)=>{ const ascii = toAscii(s).replace(/[^0-9]/g,''); return Number(ascii)||0; };
          const genId = ()=> `p_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
          const u = (typeof getCurrentUser==='function')? (getCurrentUser()||{}) : {};
          const pay = { id: genId(), loanId: loanId, type: vals.type, amount: toNum(vals.amount), date: vals.date, note: vals.note||'', createdBy: u.uid||'', createdAt: new Date().toISOString() };
          pays.push(pay);
          state.pays = pays.slice();
          try{ console.log('[DK][quickPay] added', pay); }catch{}
          try{ refreshPaysTable && refreshPaysTable(); }catch{}
          try{ refreshLoansTable && refreshLoansTable(); }catch{}
          try{ refreshLoansCards && refreshLoansCards(); }catch{}
        }catch{}
      });
    }catch{}
  }
  try{ if(typeof window!=='undefined'){ window.dk_quickAddInterestPayment = dk_quickAddInterestPayment; } }catch{}
  try{ if(typeof window!=='undefined'){ window.openPaymentFormForLoan = openPaymentFormForLoan; } }catch{}
  // Expose for console debugging
  try{ if(typeof window!=='undefined') window.computeLoanDerived = computeLoanDerived; }catch{}

  // Ensure a global Persian integer formatter exists (used across the app)
  try{
    if(typeof window !== 'undefined' && typeof window.faFormatInt !== 'function'){
      window.faFormatInt = function(n){ try{ return Number(n||0).toLocaleString('fa-IR'); }catch{ return String(n||0); } };
    }
    // Provide a global toFaDigits shim if missing
    if(typeof window !== 'undefined' && typeof window.toFaDigits !== 'function'){
      window.toFaDigits = function(s){ try{ return (typeof vj_toFaDigits === 'function') ? vj_toFaDigits(s) : String(s); }catch{ return String(s); } };
    }
    // Provide a safe date HTML shim to avoid TDZ when const bothDatesHTML is declared later
    if(typeof window !== 'undefined' && typeof window._bothDatesHTML !== 'function'){
      window._bothDatesHTML = function(iso){
        try{
          if(typeof bothDatesHTML === 'function') return bothDatesHTML(iso);
        }catch{}
        try{
          if(!iso) return '—';
          // Prefer using fmtFaDate/fmtEnDate if available to mimic table output
          if(typeof fmtFaDate==='function' && typeof fmtEnDate==='function'){
            const fa = fmtFaDate(iso);
            const en = fmtEnDate(iso);
            if(fa || en){
              return `<div>${fa||'—'}</div><div class="small" style="opacity:.8">${en||''}</div>`;
            }
          }
          const d = new Date(iso);
          if(!isNaN(d.getTime())){
            const en = d.toLocaleDateString('en-GB');
            return `<div>${String(iso)}</div><div class="small" style="opacity:.8">${en}</div>`;
          }
        }catch{}
        return '—';
      };
    }
  }catch{}

  // Robust date coercion to ISO (YYYY-MM-DD) for mixed inputs (ASCII/Jalali names)
  // Exposed globally as window.dk_coerceISO and as a local const for convenience
  (function(){
    function _dk_coerceISO(input){
      try{
        if(!input) return '';
        const toAsciiDigits = (s)=> String(s).replace(/[۰-۹]/g, (d)=> '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
        let s = toAsciiDigits(String(input)).trim();
        if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
        s = s.replace(/[\.\/]/g,'-');
        let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if(m){ const [_,y,mo,da]=m; const pad=(n)=> String(n).padStart(2,'0'); return `${y}-${pad(mo)}-${pad(da)}`; }
        m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if(m){ const [_,d,mo,y]=m; const pad=(n)=> String(n).padStart(2,'0'); return `${y}-${pad(mo)}-${pad(d)}`; }
        const faMonthsMap = { 'فروردین':1,'اردیبهشت':2,'خرداد':3,'تیر':4,'مرداد':5,'شهریور':6,'مهر':7,'آبان':8,'آذر':9,'دی':10,'بهمن':11,'اسفند':12 };
        const parts = s.split(/\s+/);
        if(parts.length>=3){
          const idx = parts.findIndex(p=> faMonthsMap[p]!=null);
          if(idx!==-1){
            const jm = faMonthsMap[parts[idx]]||0;
            const num = (x)=> parseInt(String(x).replace(/[^0-9]/g,''),10) || 0;
            const left = parts[idx-1]||''; const right = parts[idx+1]||'';
            let jd = num(left) || num(right) || 0;
            let jy = num(right) || num(left) || 0;
            if(jy && jm && jd){
              try{ const g = vj_jalaliToGregorian(jy,jm,jd); const pad=(n)=> String(n).padStart(2,'0'); return `${g[0]}-${pad(g[1])}-${pad(g[2])}`; }catch{}
            }
          }
        }
        return '';
      }catch{ return ''; }
    }
    try{ if(typeof window!=='undefined' && typeof window.dk_coerceISO!=='function') window.dk_coerceISO=_dk_coerceISO; }catch{}
    try{ if(typeof window!=='undefined') window.dk_coerceISO=_dk_coerceISO; }catch{}
    // also bind locally
    try{ /* no-op: will use global in calls below */ }catch{}
    // expose as a var in this scope
    // eslint-disable-next-line no-var
    var dk_coerceISO = _dk_coerceISO; // ensure available in this file scope
  })();

  // Build FA (Jalali) + EN dates from ISO without relying on external helpers
  function dk_bothDatesHTML(iso){
    try{
      if(!iso) return '—';
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return '—';
      const gy=parseInt(m[1],10), gm=parseInt(m[2],10), gd=parseInt(m[3],10);
      // English line (DD/MM/YYYY)
      const en = `${String(gd).padStart(2,'0')}/${String(gm).padStart(2,'0')}/${gy}`;
      // Persian (Jalali) line via Intl (most robust)
      let fa='';
      try{
        const d = new Date(Date.UTC(gy,gm-1,gd));
        fa = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year:'numeric', month:'long', day:'numeric' }).format(d);
      }catch{}
      // Fallback to simple mapping if Intl not available
      if(!fa || fa===''){
        try{
          if(typeof fmtJalaliYMD==='function'){
            // If caller can provide jalali Y/M/D this branch would be used elsewhere; here we keep fallback '—'
            fa = '';
          }else{
            fa = '';
          }
        }catch{ fa=''; }
      }
      return `<div>${fa||'—'}</div><div class=\"small\" style=\"opacity:.8\">${en}</div>`;
    }catch{ return '—'; }
  }

  // Render loans as cards (for cards view toggle)
  function refreshLoansCards(){
    try{
      const host = document.getElementById('loansCards');
      if(!host){ try{ dbg('[DK][cards] host #loansCards not found'); }catch{} return; }
      // If pays length changes (data restored async), refresh again to update progress
      try{
        const paysLen = Array.isArray(state?.pays) ? state.pays.length : 0;
        if(typeof window !== 'undefined'){
          if(window.__CARDS_PAYS_LEN !== paysLen){
            window.__CARDS_PAYS_LEN = paysLen;
            // schedule one more refresh shortly (debounced)
            clearTimeout(window.__CARDS_PAYS_REFRESH_TID);
            window.__CARDS_PAYS_REFRESH_TID = setTimeout(()=>{ try{ refreshLoansCards(); }catch{} }, 300);
          }
        }
      }catch{}
      // No inline status bar in cards view (filters live only in the top summary chips)
      let loans = [];
      try{
        if(typeof getVisibleLoansForTable === 'function'){
          loans = getVisibleLoansForTable(); // same source as table
        }else{
          loans = Array.isArray(state?.loans)? state.loans.filter(l=> String(l.status||'')!=='closed') : [];
        }
      }catch(e){ console.error('[DK][cards] load loans failed:', e); loans = []; }
      // Use exactly the list from getVisibleLoansForTable (already filtered by uiFilters)
      try{ dbg('[DK][cards] building cards, status=', uiFilters?.status||'', 'items =', loans.length); }catch{}
      const rows = loans.map(loan=>{
        try{
          // Category for card, aligned with what user sees in the status row
          const cat = (function(){
            try{
              const s = String(loan?.status||'').toLowerCase();
              // Rule:
              // - If installments remain: overdue has priority; otherwise open
              // - If no installments remain: awaiting overrides zero
              if(remInstNum > 0){
                if(isOverdue) return 'overdue';
                return 'open';
              }else{
                if(s==='awaiting') return 'awaiting';
                return 'zero';
              }
            }catch{ return 'open'; }
          })();
          const catFa = statusLabel(cat);
          const startRaw = loan.startDate || loan.start || loan.startDateAlt || loan.startIso || '';
          const repayRaw = loan.repaymentDate || loan.repayDate || loan.payoffDate || loan.repaymentDateAlt || '';
          let startIso = dk_coerceISO(startRaw) || (function(){ try{ return startRaw? toISO(startRaw):''; }catch{ return ''; } })();
          let repayIso = dk_coerceISO(repayRaw) || (function(){ try{ return repayRaw? toISO(repayRaw):''; }catch{ return ''; } })();
          try{ dbg('[DK][cards][dates]', loan.id, { startRaw, startIso, repayRaw, repayIso }); }catch{}
          // inline mode label
          const modeTxt = (function(m){ m = parseInt(String(m??1),10); return m===0?'در سررسید': m===2?'دو ماه یکبار': m===3?'سه ماه یکبار':'ماهانه'; })(loan.interestPayoutMode);
          // Remove top badge - will be shown in status row instead
          const badge = '';
          const canOps = true; // موقتی: همیشه دکمه‌ها را نشان بده
          const paidInterest = (function(){
            try{
              const toNum = (v)=>{ try{ const s=String(v??''); const ascii=(typeof normalizeDigits==='function')? normalizeDigits(s):s; const cleaned=ascii.replace(/[^0-9.\-]/g,''); const n=Number(cleaned); return Number.isFinite(n)? n:0; }catch{ return Number(v)||0; } };
              const pays = Array.isArray(state?.pays) ? state.pays : [];
              const principalPaid = pays.filter(p=> p.loanId===loan.id && p.type==='principal').reduce((a,p)=> a + toNum(p.amount), 0);
              const balance = Math.max(0, toNum(loan.principal) - principalPaid);
              const monthlyRate = toNum(loan.rateMonthlyPct)/100;
              const modeVal = parseInt(String(loan.interestPayoutMode ?? 1),10);
              const k = (modeVal===0) ? (parseInt(String(toNum(loan.interestEveryMonths)||0),10)||0) : modeVal;
              const val = Math.round(balance * monthlyRate * (k||0));
              try{ dbg('[DK][cards][paid]', loan.id, { balance, monthlyRate, modeVal, k, val }); }catch{}
              return val;
            }catch{ return 0; }
          })();
          // derived values (keep d for nextDue/balance), but compute progress locally as in table
          const d = (function(){ try{ return computeLoanDerived(loan)||{}; }catch{ return {}; } })();
          const _toNum = (v)=>{ try{ const s=String(v??''); const ascii=(typeof normalizeDigits==='function')? normalizeDigits(s):s; const cleaned=ascii.replace(/[^0-9.\-]/g,''); const n=Number(cleaned); return Number.isFinite(n)? n:0; }catch{ return Number(v)||0; } };
          // Normalize payout mode to number (handles Persian digits as well)
          const modeValP = (function(v){
            const n = _toNum(v);
            return n ? n : 1; // default monthly
          })(loan.interestPayoutMode);
          const durationMonthsP = (parseInt(String(_toNum(loan.interestEveryMonths)||0),10) || monthsDiff(loan.startDate, loan.repaymentDate) || 0);
          const totInstNum = modeValP===0 ? 1 : (durationMonthsP>0 ? Math.ceil(durationMonthsP / (modeValP||1)) : 0);
          const paidInstNum = (function(){ try{ return (state.pays||[]).filter(p=> p.loanId===loan.id && p.type==='interest').length; }catch{ return 0; } })();
          const remInstNum = Math.max(0, totInstNum - paidInstNum);
          const pct = totInstNum>0 ? Math.round((paidInstNum/totInstNum)*100) : 0;
          try{ dbg('[DK][cards][prog]', loan.id, { totInstNum, paidInstNum, remInstNum, pct, modeValP, durationMonthsP, nextDue:d.nextDue, balance:d.balance }); }catch{}
          const pctClass = pct>=66? 'high' : pct>=33? 'mid' : 'low';
          const barColor = pct>=66? '#22c55e' : pct>=33? '#f59e0b' : '#ef4444';
          const todayISO = (new Date()).toISOString().slice(0,10);
          const isOverdue = (Number(d.balance||0)>0) && d.nextDue && d.nextDue < todayISO;
          const sStat = String(loan.status||'').toLowerCase();
          // Show resolve only when all installments are paid AND loan is still open
          const needResolve = (remInstNum===0) && (sStat==='' || sStat==='open');
          const overdueMonths = (function(){
            try{
              if(!(remInstNum>0 && isOverdue)) return 0;
              const [y1,m1,dd1]=String(d.nextDue).split('-').map(n=>parseInt(n,10));
              const [y2,m2,dd2]=String(todayISO).split('-').map(n=>parseInt(n,10));
              let months=(y2-y1)*12+(m2-m1);
              if(dd2>=dd1) months+=1; months=Math.max(1, months|0); return months;
            }catch{ return 0; }
          })();
          try{ dbg('[DK][cards][status]', loan.id, { isOverdue, needResolve, overdueMonths, status:String(loan.status||'') }); }catch{}
          // Build status with local overdue detection (more reliable than table)
          const statusHTML = (function(){
            try{
            const parts = [];
            const todayISO = (new Date()).toISOString().slice(0,10);
            // If no installments remain, show badge based on status: awaiting > done
            if(remInstNum===0){
              const sNow = String(loan?.status||'').toLowerCase();
              const badge = (sNow==='awaiting')
                ? `<span class="badge awaiting">${statusLabel('awaiting')}</span>`
                : `<span class="badge done">${statusLabel('zero')}</span>`;
              const btn = `<button class="btn small resolve" data-act="resolve" data-id="${loan.id}" onclick="try{ window.dkResolveCard && window.dkResolveCard('${loan.id}'); }catch{}"><span class="ico">⏰</span><span>رسیدگی</span></button>`;
              return `<div class="badges-left">${badge}</div>${btn}`;
            }
            // Recompute derived snapshot locally to avoid any stale/closure issues
            const d2 = (function(){ try{ return computeLoanDerived(loan)||{}; }catch{ return {}; } })();
            // Derived overdue strictly from schedule dates (independent of balance to avoid false negatives)
            const hasRemainingInst = remInstNum > 0;
            // Use outer-scope repayIso if available; otherwise try to coerce from any field
            const repayBaseISO = (function(){
              try{
                if(typeof repayIso !== 'undefined' && repayIso) return repayIso; // from outer scope
              }catch{}
              try{
                const raw = loan.repaymentDate || loan.repayDate || loan.payoffDate || loan.repaymentDateAlt || '';
                return raw ? toISO(raw) : '';
              }catch{ return ''; }
            })();
            const baseDueISO = d2.nextDue || repayBaseISO || '';
            const isActuallyOverdue = (function(){
              try{ return hasRemainingInst && !!baseDueISO && String(baseDueISO) < todayISO; }catch{ return false; }
            })();
            let actualOverdueMonths = 0;
            if(isActuallyOverdue){
              try{
                const base = String(baseDueISO || '');
                const [y1,m1,dd1] = base.split('-').map(n=>parseInt(n,10));
                const [y2,m2,dd2] = todayISO.split('-').map(n=>parseInt(n,10));
                let months = (y2-y1)*12+(m2-m1);
                if(dd2>=dd1) months += 1;
                actualOverdueMonths = Math.max(1, months|0);
              }catch{}
            }

            // Targeted debug for problematic card id
            try{
              if(loan && loan.id === 'yjod0ut1d5dmeqy5pdr'){
                console.log('[DK][cards][statusHTML][yjod0ut1d5dmeqy5pdr]', {
                  todayISO, remInstNum, balance: Number(d2.balance||0), nextDue: d2.nextDue || '', repayIso: repayBaseISO,
                  baseDueISO, hasRemainingInst, isActuallyOverdue, actualOverdueMonths
                });
              }
            }catch{}

            // Build badges for status row (single source of truth)
            const badges = [];
            try{
              if(cat==='zero') badges.push('<span class="badge done">'+statusLabel('zero')+'</span>');
              else if(cat==='awaiting') badges.push('<span class="badge awaiting">'+statusLabel('awaiting')+'</span>');
              else if(cat==='open' && !isActuallyOverdue) badges.push('<span class="badge good">'+statusLabel('open')+'</span>');
            }catch{}
            try{
              // Show overdue badge only when not awaiting/zero
              if(isActuallyOverdue && actualOverdueMonths>0 && cat!=='awaiting' && cat!=='zero'){
                const faMonths = (typeof vj_toFaDigits==='function')? vj_toFaDigits(String(actualOverdueMonths)) : String(actualOverdueMonths);
                badges.push(`<span class="badge warn">${faMonths} ماه دیرکرد</span>`);
              }
            }catch{}
            
            const leftSide = badges.length > 0
              ? `<div class="badges-left">${badges.join('')}</div>`
              : `<div class="badges-left">${statusLabel(cat)}</div>`;
            let rightSide = '';
            // Show resolve when:
            // - overdue (pay due)
            // - all installments are paid (type-2 resolve)
            // - awaiting principal (robust: status or cat or table badge)
            const hasAwaitingBadge = badges.some(b=> b.includes('badge awaiting'));
            const hasOverdueBadge = badges.some(b=> b.includes('badge warn'));
            const hasDoneBadge    = badges.some(b=> b.includes('badge done'));
            // Show resolve button for ZERO and AWAITING regardless of permissions, and for OVERDUE when canOps
            const showResolve = (
              remInstNum===0 || hasDoneBadge || sStat==='awaiting' || cat==='awaiting' || hasAwaitingBadge ||
              (isActuallyOverdue && canOps) || (hasOverdueBadge && canOps)
            );
            if(showResolve){
              rightSide = `<button class=\"btn small resolve\" data-act=\"resolve\" data-id=\"${loan.id}\" onclick=\"try{ window.dkResolveCard && window.dkResolveCard('${loan.id}'); }catch{}\"><span class=\"ico\">⏰</span><span>رسیدگی</span></button>`;
            }
            const finalHTML = `${leftSide}${rightSide ? rightSide : ''}`;
            return finalHTML;
            }catch(err){
              try{ console.error('[DK][cards][statusHTML] fail', err); }catch{}
              // Fallback minimal status row to avoid breaking card rendering
              return `<div class="badges-left">${statusLabel(cat)}</div>`;
            }
          })();
          return `
            <div class="loan-card lc-v2" data-id="${loan.id}" data-cat="${cat}" data-label="${catFa}" title="${loan.borrower||''}">
              ${badge}
              <div class="lc-title-center">جزئیات آیتم</div>
              <div class="lc-info">
                <div class="muted">بستانکار</div><div class="val">${loan.creditor||'—'}</div>
                <div class="muted">گیرنده</div><div class="val">${loan.borrower||'—'}</div>
                <div class="muted">شروع</div><div class="val">${(function(){
                  try{ if(startIso) return dk_bothDatesHTML(startIso); }catch{}
                  try{ if(startRaw) return dk_bothDatesHTML(startRaw); }catch{}
                  return '—';
                })()}</div>
                <div class="muted">اصل</div><div class="val">${Number(loan.principal||0).toLocaleString('fa-IR')} تومان</div>
                <div class="muted extra-row">سود ماهانه</div><div class="val extra-row">${vj_toFaDigits(String(Number(loan.rateMonthlyPct||0)))}٪ در ماه</div>
                <div class="muted extra-row">مدت قرض</div><div class="val extra-row">${loan.interestEveryMonths? vj_toFaDigits(String(loan.interestEveryMonths))+' ماه' : '—'}</div>
                <div class="muted">نحوه پرداخت سود</div><div class="val">${modeTxt}</div>
                <div class="muted">سود پرداختی</div><div class="val">${Number(paidInterest).toLocaleString('fa-IR')} تومان</div>
                <div class="muted">پیشرفت اقساط</div><div class="val">
                  <div class="mini-progress" style="height:6px;background:rgba(255,255,255,.15);border-radius:999px;overflow:hidden">
                    <span class="${pctClass}" style="display:block;height:100%;background:${barColor};width:${pct}%"></span>
                  </div>
                  <div class="small" style="opacity:.85; margin-top:4px">${toFaDigits(String(paidInstNum))} از ${toFaDigits(String(totInstNum))} — ${toFaDigits(String(pct))}٪</div>
                </div>
                <div class="muted">وضعیت</div><div class="val status-badges">${statusHTML}</div>
                <div class="muted extra-row">اقساط مانده</div><div class="val extra-row">${toFaDigits(String(remInstNum))}</div>
                <div class="muted">تسویه نهایی</div><div class="val">${(function(){
                  try{ if(repayIso) return dk_bothDatesHTML(repayIso); }catch{}
                  try{ if(repayRaw) return dk_bothDatesHTML(repayRaw); }catch{}
                  return '—';
                })()}</div>
                <div class="muted extra-row">توضیحات</div><div class="val extra-row">${(loan.notes||'—').trim().replace(/\n/g,'<br>')}</div>
              </div>
              <div class="lc-foot">
                ${canOps ? `<button class="btn small edit" data-act="edit" data-id="${loan.id}">✏️ ویرایش</button>` : ''}
                <button class="btn small" data-act="history" data-id="${loan.id}">📜 تاریخچه پرداخت</button>
                ${canOps ? `<button class="btn small danger" data-act="del" data-id="${loan.id}">🗑️ حذف</button>` : ''}
                ${(isOverdue && canOps) ? `<button class="btn small resolve" data-act="resolve" data-id="${loan.id}"><span class="ico">⏰</span><span>رسیدگی</span></button>` : ''}
                <button class="btn small ghost" data-act="info" data-id="${loan.id}">ℹ️ جزئیات</button>
              </div>
            </div>`;
        }catch(cardErr){ console.error('[DK][cards] card build failed for id', loan?.id, cardErr); return `<div class="loan-card lc-v2" data-id="${loan?.id||''}"><div class="lc-title-center">جزئیات آیتم</div><div class="lc-info"><div>—</div><div>خطا در نمایش کارت</div></div></div>`; }
      }).join('');
      if(loans.length===0){
        host.innerHTML = `<div class="small" style="opacity:.8; padding:12px">هیچ آیتمی برای نمایش در این نما پیدا نشد.</div>`;
      }else{
        host.innerHTML = rows || '';
      }
      try{ dbg('[DK][cards] render complete, count =', loans.length); }catch{}
      // Ensure print button exists on each card (top-left)
      try{
        if(window.PrintCard && typeof window.PrintCard.init==='function') window.PrintCard.init();
        const cards = Array.from(host.querySelectorAll('.loan-card'));
        cards.forEach(c=>{ try{ window.PrintCard && typeof window.PrintCard.ensureButton==='function' && window.PrintCard.ensureButton(c); }catch{} });
      }catch{}
      // Update equal heights when needed
      (function(){
        try{
          const updateCardHeights = ()=>{
            const cardsWrap = host;
            if(!cardsWrap) return;
            const cards = Array.from(cardsWrap.querySelectorAll('.loan-card'));
            if(cards.length===0) return;
            const anyOpen = cards.some(c=> c.classList.contains('details-open'));
            // Reset heights before measuring
            cards.forEach(c=>{ c.style.height=''; });
            // Baseline equal height when none is open
            if(!anyOpen){
              // measure natural heights and choose max
              let maxH = 0;
              cards.forEach(c=>{ maxH = Math.max(maxH, c.getBoundingClientRect().height); });
              cards.forEach(c=>{ c.style.height = Math.ceil(maxH) + 'px'; });
            }else{
              // When one is open: keep others at baseline if known
              // Compute baseline as the tallest closed card
              let base = 0;
              cards.forEach(c=>{ if(!c.classList.contains('details-open')) base = Math.max(base, c.getBoundingClientRect().height); });
              if(base>0){
                cards.forEach(c=>{
                  if(c.classList.contains('details-open')){ c.style.height=''; }
                  else{ c.style.height = Math.ceil(base) + 'px'; }
                });
              }
            }
          };
          // initial call after render completes
          setTimeout(updateCardHeights, 0);
          // expose locally for handlers
          host._updateCardHeights = updateCardHeights;
          window.addEventListener('resize', ()=>{ try{ updateCardHeights(); }catch{} });
        }catch{}
      })();

      if(!host._bound){
        // Helper: switch to table view and focus a row by loan id
        const gotoTable = (id)=>{
          try{
            const card = host.closest('.card') || document;
            const btnT = card.querySelector('#viewTableBtn');
            const wrap = card.querySelector('.table-wrap');
            const cards = card.querySelector('#loansCards');
            try{ localStorage.setItem('dkLoansView','table'); }catch{}
            try{ if(wrap) wrap.style.display=''; if(cards) cards.style.display='none'; if(btnT){ btnT.classList.remove('ghost'); btnT.setAttribute('aria-selected','true'); } card.querySelector('#viewCardsBtn')?.classList.add('ghost'); }catch{}
            try{ refreshLoansTable(); }catch{}
            const row = document.querySelector(`#loansTable tbody tr[data-id="${id}"]`);
            if(row){
              row.scrollIntoView({ behavior:'smooth', block:'center' });
              // temporary highlight
              const prev = row.style.boxShadow;
              row.style.boxShadow = '0 0 0 2px var(--purple) inset';
              setTimeout(()=>{ try{ row.style.boxShadow = prev; }catch{} }, 1400);
            }
          }catch{}
        };

        // Helper: click the corresponding table action; if not found, switch to table and retry with backoff
        const clickTableAction = (action, id)=>{
          try{
            const sel = `#loansTable button[data-act="${action}"][data-id="${id}"]`;
            const tableBtn = document.querySelector(sel);
            if(tableBtn){
              console.debug('[DK][cards->table] action (immediate)', action, 'id=', id);
              tableBtn.click();
              return true;
            }else{
              console.debug('[DK][cards->table] not found immediate', action, id, 'selector=', sel);
            }
          }catch(err){ console.warn('[DK][cards->table] immediate lookup failed', err); }
          // ensure table view, then retry after it renders
          try{ gotoTable(id); }catch(err){ console.warn('[DK][cards->table] gotoTable failed', err); }
          const tries = [120, 280, 600];
          tries.forEach((ms, i)=>{
            setTimeout(()=>{
              try{
                const sel = `#loansTable button[data-act="${action}"][data-id="${id}"]`;
                const b2 = document.querySelector(sel);
                if(b2){
                  console.debug(`[DK][cards->table] retry#${i+1} found`, action, 'id=', id);
                  b2.click();
                }else{
                  console.debug(`[DK][cards->table] retry#${i+1} missing`, action, 'id=', id);
                }
              }catch(err){ console.warn(`[DK][cards->table] retry#${i+1} error`, err); }
            }, ms);
          });
          return false;
        };

        host.addEventListener('click', async (ev)=>{
          const btn = ev.target.closest('button[data-act]');
          if(btn){
            let act = btn.getAttribute('data-act');
            const id = btn.getAttribute('data-id');
            if(!id) return;
            const loan = (state.loans||[]).find(l=> l.id===id);
            if(!loan) return;

            // Edit is handled centrally by EditCard module to avoid regressions
            if(act==='edit'){ return; }

            // سایر اکشن‌های مشترک با جدول: del, resolve
            // نرمال‌سازی: در برخی کارت‌ها هنوز data-act="loan-pay" است؛ آن را به "resolve" نگاشت می‌کنیم
            if(act==='loan-pay') act = 'resolve';

            // رفتار مستقیم دکمه «رسیدگی» (بدون تکیه به جدول)
            if(act==='resolve'){
              try{
                // تشخیص دیرکرد
                const cardEl = btn.closest('.loan-card');
                const hasOverdueBadge = !!cardEl?.querySelector('.status-badges .badge.warn');
                let isOverdue = hasOverdueBadge;
                let rem0 = false;
                let awaiting = false;
                try{
                  const d = computeLoanDerived(loan) || {};
                  const today = new Date().toISOString().slice(0,10);
                  isOverdue = isOverdue || ((Number(d.balance)>0) && d.nextDue && d.nextDue < today);
                  const r = Number(d.remainingInstallments||0);
                  rem0 = (r===0);
                }catch{}
                try{
                  // Robust awaiting detection: from loan.status or card DOM (badge/dataset)
                  const s = String(loan.status||'').toLowerCase();
                  const catAttr = cardEl?.dataset?.cat || '';
                  const hasAwaitBadge = !!cardEl?.querySelector('.status-badges .badge.awaiting');
                  awaiting = (s==='awaiting') || (catAttr==='awaiting') || hasAwaitBadge;
                }catch{}
                try{ console.debug('[DK][cards] resolve click', { id, isOverdue, rem0, awaiting }); }catch{}

                // سیاست: 
                // - دیرکرد: فرم پرداخت را باز کن
                // - اقساط تمام شد یا awaiting: تسویه/رسیدگی نوع ۲
                if(isOverdue){
                  let handled = false;
                  try{
                    if(typeof openPaymentFormForLoan === 'function'){
                      openPaymentFormForLoan(id);
                      handled = true;
                    }
                  }catch(e){ console.warn('[DK][cards] openPaymentFormForLoan failed', e); }
                  if(!handled){
                    // Fallback to table action if global helper is unavailable
                    try{ clickTableAction('loan-pay', id); handled = true; }catch{}
                  }
                  return;
                }
                if(rem0 || awaiting){
                  try{ await resolveZeroInstallments(id); }catch(e){ console.warn('[DK][cards] resolveZeroInstallments failed', e); }
                  return;
                }
                // پیش‌فرض: تلاش برای مسیر جدول (fallback)
                try{ clickTableAction('resolve', id); }catch{}
                return;
              }catch{}
            }

            const delegatedActs = ['del','resolve'];
            if(delegatedActs.includes(act)){
              clickTableAction(act, id);
              return;
            }

            if(act==='history'){
              try{ await dk_showPaysHistoryModal(id, 'all'); }catch{}
              return;
            }
            if(act==='info'){
              try{
                const cardEl = btn.closest('.loan-card');
                if(cardEl){
                  const open = cardEl.classList.toggle('details-open');
                  // Update button label
                  try{
                    btn.textContent = open ? 'بستن جزئیات' : 'ℹ️ جزئیات';
                  }catch{}
                  // Ensure into view when opening
                  if(open){ cardEl.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
                  // update equal heights/baseline
                  try{ host._updateCardHeights && host._updateCardHeights(); }catch{}
                }
              }catch{}
              return;
            }
          }
          // No default navigation on card click anymore; only explicit buttons act.
          // Intentionally left blank.
          
        });
host._bound = true;
      }
    }catch{}
  }
  // Expose for external callers (summary chips, modules)
  try{ if(typeof window!== 'undefined'){ window.refreshLoansCards = refreshLoansCards; } }catch{}

  // View toggle between table and cards, persisted in localStorage
  function bindLoansViewToggle(){
    try{
      const btnT = document.getElementById('viewTableBtn');
      const btnC = document.getElementById('viewCardsBtn');
      // Scope to the same card container to avoid picking other tables' wraps
      const card = (btnT && btnT.closest('.card')) || (btnC && btnC.closest('.card')) || document;
      const wrap = card.querySelector('.table-wrap');
      const cards = card.querySelector('#loansCards');
      // Cards-only mode: no toggles/wrap present -> just render cards and exit
      if(cards && (!btnT || !btnC || !wrap)){
        try{ setTimeout(()=>{ try{ refreshLoansCards(); }catch{} }, 0); }catch{}
        return;
      }
      if(!cards) return;
      const KEY = 'dkLoansView';
      const applyView = (v)=>{
        const isCards = (v==='cards');
        try{ wrap.style.display = isCards? 'none' : ''; }catch{}
        try{ cards.style.display = isCards? '' : 'none'; }catch{}
        try{ btnT.classList.toggle('ghost', isCards); btnT.setAttribute('aria-selected', String(!isCards)); }catch{}
        try{ btnC.classList.toggle('ghost', !isCards); btnC.setAttribute('aria-selected', String(isCards)); }catch{}
        try{ localStorage.setItem(KEY, isCards? 'cards':'table'); }catch{}
        // Ensure cards are built when switching to cards (defer to after load so bothDatesHTML is defined)
        if(isCards){ try{ setTimeout(()=>{ try{ refreshLoansCards(); }catch{} }, 0); }catch{} }
      };
      // Build cards once after current tick so all helpers are defined
      try{ setTimeout(()=>{ try{ refreshLoansCards(); }catch{} }, 0); }catch{}
      // Force default to 'cards' on every load; user may switch to 'table'
      applyView('cards');
      if(!btnT._bound){ btnT.addEventListener('click', ()=> applyView('table')); btnT._bound=true; }
      if(!btnC._bound){ btnC.addEventListener('click', ()=> applyView('cards')); btnC._bound=true; }
    }catch{}
  }

  // Cache of current user from auth listener to avoid race conditions
  let __AUTH_USER_CACHE = null;

  // Run auth UI setup on load
  (function initAuthUI(){
    try{
      if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', ()=>{ try{ bindAuthButtons(); applyAuthUI(); bindJointFields(); }catch{} });
      }else{ bindAuthButtons(); applyAuthUI(); bindJointFields(); }
      // Global auth state subscription (safe-optional)
      try{ window.firebaseApi?.auth?.onAuthStateChanged?.((u)=>{ try{ __AUTH_USER_CACHE = u||null; }catch{} applyAuthUI(); }); }catch{}
      try{ window.firebase?.auth?.()?.onAuthStateChanged?.((u)=>{ try{ __AUTH_USER_CACHE = u||null; }catch{} applyAuthUI(); }); }catch{}
      // Fallback polling (detect user appear/disappear)
      try{
        let lastUid = (getCurrentUser() && getCurrentUser().uid) || '';
        setInterval(()=>{
          try{
            const u = getCurrentUser();
            const uid = (u && u.uid) || '';
            if(uid !== lastUid){ lastUid = uid; applyAuthUI(); }
          }catch{}
        }, 800);
      }catch{}
    }catch{}
  })();

  // --- Auth UI wiring (logged-in vs logged-out layout) ---
  function applyAuthUI(){
    try{
      const u = getCurrentUser();
      const body = document.body;
      const protectedApp = document.getElementById('protectedApp');
      const authControls = document.getElementById('authControls');
      const out = authControls?.querySelector('[data-when="out"]');
      const inn = authControls?.querySelector('[data-when="in"]');
      const emailEl = document.getElementById('authEmail');
      const todayBanner = document.getElementById('todayBanner');
      const headTop = document.querySelector('.head-top');
      const headMeta = document.querySelector('.head-meta');
      if(u){
        body.classList.add('authed');
        body.classList.remove('logged-out');
        if(protectedApp){ protectedApp.style.display = 'block'; try{ protectedApp.style.removeProperty('display'); }catch{} }
        if(out){ out.style.display = 'none'; }
        if(inn) inn.style.display = 'flex';
        if(emailEl) emailEl.textContent = String(u.email||'—');
        // Ensure default view is cards on login
        try{ setTimeout(()=>{ try{ bindLoansViewToggle(); }catch{} }, 0); }catch{}
        // restore header layout
        if(headTop){ headTop.style.flexDirection = ''; headTop.style.alignItems='flex-start'; headTop.style.justifyContent='flex-start'; }
        // ensure class removal sticks after any async UI tweaks
        setTimeout(()=>{ try{ body.classList.add('authed'); body.classList.remove('logged-out'); if(protectedApp) protectedApp.style.display='block'; }catch{} }, 50);
      }else{
        body.classList.remove('authed');
        body.classList.add('logged-out');
        if(protectedApp) protectedApp.style.display = 'none';
        if(out){
          out.style.display = 'flex';
          out.style.flexDirection = 'column';
          out.style.alignItems = 'stretch';
          out.style.gap = '10px';
          out.style.margin = '12px auto 0';
          out.style.maxWidth = '380px';
          out.style.width = '100%';
        }
        if(inn) inn.style.display = 'none';
        if(todayBanner) todayBanner.innerHTML = '';
        if(headTop){ headTop.style.flexDirection = 'column'; headTop.style.alignItems='center'; headTop.style.justifyContent='center'; }
        if(headMeta){ headMeta.style.marginTop='0'; headMeta.style.textAlign='center'; }
      }
    }catch{}
  }
  // Expose for console early as well
  try{ window.dkToggleJoint = toggleJointUI; }catch{}

  function bindAuthButtons(){
    try{
      const btnLogin = document.getElementById('btnLogin');
      const btnLogout = document.getElementById('btnLogout');
      const inpEmail = document.getElementById('authEmailInput');
      const inpPass  = document.getElementById('authPassInput');
      // Enter key -> trigger login
      const bindEnter = (el)=>{
        if(!el || el._enterBound) return; el.addEventListener('keydown', (e)=>{
          if(e.key==='Enter'){
            e.preventDefault(); e.stopPropagation();
            try{ document.getElementById('btnLogin')?.click(); }catch{}
          }
        }); el._enterBound = true;
      };
      bindEnter(inpEmail); bindEnter(inpPass);
      if(btnLogin && !btnLogin._bound){
        btnLogin.addEventListener('click', async ()=>{
          try{
            const email = (inpEmail?.value||'').trim();
            const pass  = (inpPass?.value||'').trim();
            if(!email || !pass) return;
            const api = window.firebaseApi || {};
            let userCred = null;
            if(typeof api.loginWithEmailPassword === 'function'){
              userCred = await api.loginWithEmailPassword(email, pass);
            }else if(api.auth && typeof api.auth.signInWithEmailAndPassword === 'function'){
              userCred = await api.auth.signInWithEmailAndPassword(email, pass);
            }else if(window.firebase && typeof window.firebase.auth === 'function'){
              userCred = await window.firebase.auth().signInWithEmailAndPassword(email, pass);
            }
            // Update cache if user credential is returned
            try{
              const u = userCred && (userCred.user || userCred);
              if(u && u.uid){ __AUTH_USER_CACHE = u; }
            }catch{}
            // Force UI switch to authed immediately
            try{
              const body = document.body;
              const protectedApp = document.getElementById('protectedApp');
              const authControls = document.getElementById('authControls');
              const out = authControls?.querySelector('[data-when="out"]');
              const inn = authControls?.querySelector('[data-when="in"]');
              const emailEl = document.getElementById('authEmail');
              const u = __AUTH_USER_CACHE || (userCred && (userCred.user || userCred)) || null;
              body.classList.add('authed');
              body.classList.remove('logged-out');
              if(protectedApp) protectedApp.style.display = 'block';
              if(out) out.style.display = 'none';
              if(inn) inn.style.display = 'flex';
              if(u && emailEl){ emailEl.textContent = String(u.email||'—'); }
            }catch{}
            // Also re-apply after a short delay to sync with auth listeners
            try{ applyAuthUI(); }catch{}
            // After login, force default view to cards
            try{ setTimeout(()=>{ try{ bindLoansViewToggle(); }catch{} }, 0); }catch{}
            try{ setTimeout(()=>{ try{ applyAuthUI(); }catch{} }, 150); }catch{}
            // Optional: clear password field
            try{ if(inpPass) inpPass.value=''; }catch{}
          }catch{}
        });
        btnLogin._bound = true;
      }
      if(btnLogout && !btnLogout._bound){
        btnLogout.addEventListener('click', async ()=>{
          try{
            const api = window.firebaseApi || {};
            if(api.auth && typeof api.auth.signOut === 'function') await api.auth.signOut();
            else if(typeof api.logout === 'function') await api.logout();
            // Immediate UI switch to logged-out
            try{
              __AUTH_USER_CACHE = null;
              const body = document.body;
              body.classList.remove('authed');
              body.classList.add('logged-out');
              const protectedApp = document.getElementById('protectedApp');
              const authControls = document.getElementById('authControls');
              const out = authControls?.querySelector('[data-when="out"]');
              const inn = authControls?.querySelector('[data-when="in"]');
              if(protectedApp) protectedApp.style.display = 'none';
              if(out) out.style.display = 'flex';
              if(inn) inn.style.display = 'none';
            }catch{}
          }catch{}
        });
        btnLogout._bound = true;
      }
    }catch{}
  }

  // --- Vanilla Jalali Datepicker (lightweight, no deps) ---
  // Local Jalaali helpers (self-contained for vanilla picker)
  function vj_div(a,b){ return Math.floor(a/b); }
  function vj_jalCal(jy){
    const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    let bl=breaks.length, gy=jy+621, leapJ=-14, jp=breaks[0], jm, jump=0, leap, n, i;
    if(jy<jp||jy>=breaks[bl-1]) return {leap:0, gy:gy, march:0};
    for(i=1;i<bl;i+=1){ jm=breaks[i]; jump=jm-jp; if(jy<jm) break; leapJ=leapJ+vj_div(jump,33)*8+vj_div(jump%33,4); jp=jm; }
    n=jy-jp; leapJ=leapJ+vj_div(n,33)*8+vj_div((n%33)+3,4); if((jump%33)===4 && jump-n===4) leapJ+=1; const leapG=vj_div(gy,4)-vj_div((vj_div(gy,100)+1)*3,4)-150; const march=20+leapJ-leapG; if(jump-n<6) n=n-jump+vj_div(jump+4,33)*33; leap=((n+1)%33)-1; if(leap===-1) leap=4; return {leap:leap, gy:gy, march:march};
  }
  function vj_j2d(jy,jm,jd){ const r=vj_jalCal(jy); return vj_g2d(r.gy,3, r.march)+ (jm-1)*31 - vj_div(jm,7)*(jm-7) + jd -1; }
  function vj_g2d(gy,gm,gd){ const d=vj_div((gy+vj_div(gm-8,6)+100100)*1461,4)+vj_div(153*((gm+9)%12)+2,5)+gd-34840408; return d - vj_div(vj_div(gy+100100+vj_div(gm-8,6),100)*3,4)+752; }
  function vj_d2g(j){ let j2=4*j+139361631, i=vj_div(j2%146097,4)*4+3; let gd=vj_div((i%1461),4)*5+2; let gm=vj_div(((gd%153)+5),5)+3; let gy=vj_div(j2/146097,4)-100100+vj_div(8-gm,6); gd = vj_div((gd%153),5)+1; return [gy, gm, gd]; }
  function vj_jalaliToGregorian(jy,jm,jd){ const g = vj_d2g(vj_j2d(jy,jm,jd)); return [g[0], g[1], g[2]]; }
  function vj_d2j(j){
    const g = vj_d2g(j); // [gy,gm,gd]
    let gy = g[0], gm = g[1], gd = g[2];
    let jy = gy - 621;
    const r = vj_jalCal(jy);
    const jdn1f = vj_g2d(gy, 3, r.march);
    let k = j - jdn1f;
    let jm, jd;
    if(k >= 0){
      if(k <= 185){ jm = 1 + vj_div(k,31); jd = (k % 31) + 1; }
      else { k -= 186; jm = 7 + vj_div(k,30); jd = (k % 30) + 1; }
    }else{
      jy -= 1;
      k += 179 + (r.leap===1 ? 1 : 0);
      jm = 7 + vj_div(k,30);
      jd = (k % 30) + 1;
    }
    return [jy, jm, jd];
  }
  function isJalaliLeap(jy){ try{ const c = vj_jalCal(jy); return !!c && c.leap===1; }catch{return false} }
  const faMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  function vj_toFaDigits(s){
    const map = {'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
    let t=''; for(const ch of String(s)) t += (map[ch] ?? ch); return t;
  }
  function vj_normalizeDigits(s){
    const map = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
    let t=''; for(const ch of String(s)) t += (map[ch] ?? ch); return t;
  }
  const pad2 = (n)=> String(n).padStart(2,'0');
  function fmtJalaliYMD(jy,jm,jd, faDigits=true){
    const s = `${jy}/${pad2(jm)}/${pad2(jd)}`;
    return faDigits ? vj_toFaDigits(s) : s;
  }
  function daysInJalaliMonth(jy,jm){
    if(jm<=6) return 31; if(jm<=11) return 30; return isJalaliLeap(jy)?30:29;
  }
  function jFirstWeekdayUTC(jy,jm){
    const [gy,gm,gd] = jalaliToGregorian(jy,jm,1);
    const d = new Date(Date.UTC(gy,gm-1,gd));
    // Map 0=Sun..6=Sat to Sat-first index: 0=Sat,1=Sun,...,6=Fri
    const wd = d.getUTCDay();
    return (wd + 1) % 7;
  }
  function initVanillaJdp(inputSel, altSel, hintSel, opts){
    const options = Object.assign({ prefillToday: true, dashWhenEmpty: false, debugHints: true, showTodayHintWhenEmpty: true }, opts||{});
    const input = document.querySelector(inputSel);
    if(!input) return;
    // Ensure styles for 'today' ring are present once
    (function injectVJStylesOnce(){
      if(document.getElementById('vjdp-style')) return;
      const st = document.createElement('style');
      st.id = 'vjdp-style';
      st.textContent = `
        .vjal-pop td{ transition: background-color .12s ease; }
        .vjal-pop td.vj-today{ outline: 2px solid #ef4444; outline-offset: -2px; border-radius: 8px; }
        .vjal-pop td.vj-selected{ background: rgba(59,130,246,.22); border-radius: 8px; }
        .vjal-pop td:hover{ background: rgba(59,130,246,.35); }
      `;
      document.head.appendChild(st);
    })();
    // Prevent plugin attaching on this field if present
    try{
      if(window.jQuery){
        const $inp = window.jQuery(input);
        try{ $inp.persianDatepicker('destroy'); }catch{}
        try{ $inp.off('mousedown click focus'); }catch{}
      }
    }catch{}
    try{ input.classList.remove('pwt-datepicker-input-element'); }catch{}
    input.setAttribute('readonly','');
    // Build popup container
    const pop = document.createElement('div');
    pop.className = 'vjal-pop';
    pop.style.cssText = 'position:absolute; z-index:9999; background:#101623; color:#eee; border:1px solid #2b364d; border-radius:10px; padding:8px; box-shadow:0 8px 24px rgba(0,0,0,.35); display:none; direction:rtl;';
    const nav = document.createElement('div');
    nav.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;';
    const btnPrev = document.createElement('button'); btnPrev.textContent='‹'; btnPrev.className='btn small ghost';
    const title = document.createElement('div'); title.style.cssText='flex:1; text-align:center; font-weight:600;';
    const btnNext = document.createElement('button'); btnNext.textContent='›'; btnNext.className='btn small ghost';
    // Quick month/year selectors and Today
    const wrapQuick = document.createElement('div'); wrapQuick.style.cssText='display:flex; align-items:center; gap:6px;';
    const selMonth = document.createElement('select'); selMonth.className='small'; selMonth.style.cssText='background:#0f1522; color:#ccd; border:1px solid #2b364d; border-radius:6px; padding:2px 6px;';
    for(let i=1;i<=12;i++){ const o=document.createElement('option'); o.value=String(i); o.textContent=faMonths[i-1]; selMonth.appendChild(o); }
    const selYear = document.createElement('select'); selYear.className='small'; selYear.style.cssText='background:#0f1522; color:#ccd; border:1px solid #2b364d; border-radius:6px; padding:2px 6px;';
    const btnToday = document.createElement('button'); btnToday.textContent='امروز'; btnToday.className='btn small';
    wrapQuick.append(btnToday, selYear, selMonth);
    nav.append(btnPrev, title, btnNext);
    // Weekday label (FA long), e.g., پنج‌شنبه
    const weekdayEl = document.createElement('div');
    weekdayEl.className = 'vj-weekday';
    weekdayEl.style.cssText = 'text-align:center; color:#bcd0ff; margin:6px 0 8px; font-size:12px;';
    const faWeekLongSunFirst = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه','شنبه'];
    function setWeekday(jy,jm,jd){
      try{
        const g = jalaliToGregorian(jy,jm,jd);
        const d = new Date(Date.UTC(g[0], g[1]-1, g[2]));
        const wd = d.getUTCDay(); // 0=Sun..6=Sat
        weekdayEl.textContent = faWeekLongSunFirst[wd] || '';
      }catch{ weekdayEl.textContent=''; }
    }
    const grid = document.createElement('table');
    grid.style.cssText = 'width:100%; border-collapse:collapse;';
    const thead = document.createElement('thead');
    // Header order LTR in DOM (Sat-first): ش (Sat), ی (Sun), د (Mon), س (Tue), چ (Wed), پ (Thu), ج (Fri)
    // This matches jFirstWeekdayUTC mapping: idx = (getUTCDay() + 1) % 7
    thead.innerHTML = '<tr><th>ش</th><th>ی</th><th>د</th><th>س</th><th>چ</th><th>پ</th><th>ج</th></tr>';
    const tbody = document.createElement('tbody');
    grid.append(thead, tbody);
    pop.append(nav, weekdayEl, wrapQuick, grid);
    document.body.appendChild(pop);

    // State
    const [ty,tM,tD] = (function(){
      // derive Jalali today using Intl Persian calendar in UTC
      const now = new Date();
      const dUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const fmtY = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', year: 'numeric' });
      const fmtM = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', month: 'numeric' });
      const fmtD = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', day: 'numeric' });
      const jy = parseInt(vj_normalizeDigits(fmtY.format(dUTC)), 10);
      const jm = parseInt(vj_normalizeDigits(fmtM.format(dUTC)), 10);
      const jd = parseInt(vj_normalizeDigits(fmtD.format(dUTC)), 10);
      return [jy, jm, jd];
    })();
    // Placeholder dash if requested
    if(options.dashWhenEmpty){ try{ input.placeholder = '—'; }catch{} }
    // Prefill/normalize input only when allowed
    try{
      const raw0 = String(input.value||'');
      const ascii0 = vj_normalizeDigits(raw0);
      const okFormat = /^\d{4}\/\d{2}\/\d{2}$/.test(ascii0);
      if(options.prefillToday){ if(!okFormat) input.value = fmtJalaliYMD(ty, tM, tD, true); }
      else { if(!okFormat) input.value = ''; }
    }catch{}
    let curY = ty, curM = tM;

    // Ensure hint element exists (create inline if missing)
    let hintEl = null;
    try{
      hintEl = hintSel ? document.querySelector(hintSel) : null;
      if(!hintEl){
        const s = document.createElement('small');
        s.className = 'small';
        s.setAttribute('role','status');
        s.setAttribute('aria-live','polite');
        const hid = (input.id ? (input.id + 'Hint') : '');
        if(hid) s.id = hid;
        s.style.cssText = 'display:block; min-height:18px; margin-top:4px; color:#9fb0c9;';
        // Prefer inserting after parent container to avoid clipping
        const parent = input.parentElement;
        if(parent && parent.insertAdjacentElement){
          parent.insertAdjacentElement('afterend', s);
        }else{
          input.insertAdjacentElement('afterend', s);
        }
        hintEl = s;
        
      }else{
        try{ hintEl.style.display = 'block'; hintEl.style.minHeight = '18px'; }catch{}
        
      }
    }catch{}
    // Update hint below the input (Persian + English) based on alt ISO
    function updateHint(){
      try{
        
        const hint = hintEl;
        if(!hint) return;
        let iso = '';
        const alt = altSel ? document.querySelector(altSel) : null;
        const altVal = alt ? String(alt.value||'') : '';
        
        if(alt && isValidISO(altVal)){ iso = altVal; }
        else{
          // try to derive from input value (strict, then loose)
          const raw = vj_normalizeDigits(String(input.value||'')).trim();
          let m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
          if(!m && raw){ m = raw.match(/(\d{4}).*?(\d{1,2}).*?(\d{1,2})/); }
          if(m){
            const jy=parseInt(m[1],10), jm=parseInt(m[2],10), jd=parseInt(m[3],10);
            const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
            const mm = String(gm).padStart(2,'0'); const dd = String(gd).padStart(2,'0');
            iso = `${gy}-${mm}-${dd}`;
          }
        }
        // Fallback: if nothing to show, use today's date without Intl dependencies
        if(!iso){
          try{
            // FA from Jalali today (already computed: ty,tM,tD)
            const fa = `${vj_toFaDigits(String(ty))} ${faMonths[tM-1]} ${vj_toFaDigits(String(tD))}`;
            // EN from UTC today
            const now = new Date();
            const dUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dUTC.getUTCDay()];
            const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dUTC.getUTCMonth()];
            const en = `${w}, ${String(dUTC.getUTCDate()).padStart(2,'0')} ${mon} ${dUTC.getUTCFullYear()}`;
            hint.textContent = `${fa} — ${en}`;
            try{ input.title = hint.textContent || ''; }catch{}
            return; // done
          }catch(e){ }
        }
        let fa = iso ? fmtFaDate(iso) : '';
        let en = iso ? fmtEnDate(iso) : '';
        // If helpers returned empty, try manual formatting
        if(iso && (!fa || !en)){
          try{
            const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if(m){
              const gy=parseInt(m[1],10), gm=parseInt(m[2],10), gd=parseInt(m[3],10);
              const j = vj_d2j(vj_g2d(gy,gm,gd));
              const jy=j[0], jm=j[1], jd=j[2];
              if(!fa) fa = `${vj_toFaDigits(String(jy))} ${faMonths[jm-1]} ${vj_toFaDigits(String(jd))}`;
              if(!en){
                const d = new Date(Date.UTC(gy,gm-1,gd));
                const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
                const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][gm-1];
                en = `${w}, ${gd} ${mon} ${gy}`;
              }
            }
          }catch{}
        }
        hint.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '—');
        if(!hint.textContent || hint.textContent === ''){
          try{
            const faToday = `${vj_toFaDigits(String(ty))} ${faMonths[tM-1]} ${vj_toFaDigits(String(tD))}`;
            const now = new Date();
            const dUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const w = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dUTC.getUTCDay()];
            const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dUTC.getUTCMonth()];
            const enToday = `${w}, ${String(dUTC.getUTCDate()).padStart(2,'0')} ${mon} ${dUTC.getUTCFullYear()}`;
            hint.textContent = `${faToday} — ${enToday}`;
          }catch{}
        }
        try{ input.title = hint.textContent || ''; }catch{}
      }catch{}
    }
    // Run once after defining to reflect any pre-existing value/alt and set weekday
    try{
      // from input value if present else today
      (function(){
        const raw = vj_normalizeDigits(String(input.value||''));
        const m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if(m){ setWeekday(parseInt(m[1],10), parseInt(m[2],10), parseInt(m[3],10)); }
        else{ setWeekday(ty,tM,tD); }
      })();
      updateHint();
    }catch{}
    // Populate year select around current Jalali year
    function fillYearOptions(center){
      try{
        selYear.innerHTML='';
        for(let y=center-5; y<=center+5; y++){
          const o = document.createElement('option'); o.value=String(y); o.textContent=vj_toFaDigits(String(y)); selYear.appendChild(o);
        }
        selYear.value = String(center);
      }catch{}
    }
    fillYearOptions(curY);
    selMonth.value = String(curM);

    function place(){
      const r = input.getBoundingClientRect();
      pop.style.left = `${Math.round(window.scrollX + r.left)}px`;
      pop.style.top  = `${Math.round(window.scrollY + r.bottom + 6)}px`;
    }
    function render(){
      title.textContent = `${vj_toFaDigits(String(curY))} ${faMonths[curM-1]}`;
      tbody.innerHTML = '';
      const first = jFirstWeekdayUTC(curY,curM); // 0..6 with Sat=0
      const dim = daysInJalaliMonth(curY,curM);
      let day=1, row;
      for(let i=0;i<6;i++){
        row = document.createElement('tr');
        for(let j=0;j<7;j++){
          const cell = document.createElement('td');
          cell.style.cssText = 'width:26px; height:26px; text-align:center; padding:3px; border-radius:6px; cursor:pointer;';
          if(i===0 && j<first){ cell.textContent=''; row.appendChild(cell); continue; }
          if(day>dim){ cell.textContent=''; row.appendChild(cell); continue; }
          cell.textContent = vj_toFaDigits(String(day));
          // today highlight with red ring
          if(curY===ty && curM===tM && day===tD){ cell.classList.add('vj-today'); }
          const jy=curY, jm=curM, jd=day;
          cell.addEventListener('click', ()=>{
            // set visible Jalali
            input.value = fmtJalaliYMD(jy,jm,jd,true);
            // set hidden ISO with +1 day fix
            try{
              const alt = altSel ? document.querySelector(altSel) : null;
              const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
              const mm = String(gm).padStart(2,'0'); const dd = String(gd).padStart(2,'0');
              const iso = `${gy}-${mm}-${dd}`;
              if(alt && isValidISO(iso)) alt.value = iso;
            }catch{}
            setWeekday(jy,jm,jd);
            // trigger hint update
            input.dispatchEvent(new Event('input', {bubbles:true}));
            input.dispatchEvent(new Event('change', {bubbles:true}));
            updateHint();
            hide();
          });
          row.appendChild(cell); day++;
        }
        tbody.appendChild(row);
        if(day>dim) break;
      }
    }
    function sanitize(){
      try{
        const raw = String(input.value||'');
        const ascii = vj_normalizeDigits(raw);
        const m = ascii.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if(!m){
          if(options.prefillToday){ input.value = fmtJalaliYMD(ty, tM, tD, true); }
          else { input.value = ''; }
        }else{
          // keep ALT in sync if user changed the date
          try{
            const jy=parseInt(m[1],10), jm=parseInt(m[2],10), jd=parseInt(m[3],10);
            const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
            const mm = String(gm).padStart(2,'0'); const dd = String(gd).padStart(2,'0');
            const iso = `${gy}-${mm}-${dd}`;
            const alt = altSel ? document.querySelector(altSel) : null;
            if(alt){
              alt.value = iso;
              try{ alt.dispatchEvent(new Event('change', {bubbles:true})); }catch{}
            }
            try{
              input.dispatchEvent(new Event('input', {bubbles:true}));
              input.dispatchEvent(new Event('change', {bubbles:true}));
            }catch{}
          }catch{}
        }
      }catch{}
      updateHint();
    }
    function show(){
      try{ hideJalaliPicker(input); }catch{}
      // Do not write today automatically in dash mode
      if(options.prefillToday) sanitize();
      else updateHint();
      // If input already has a date, open on that month/year
      try{
        const ascii = vj_normalizeDigits(String(input.value||''));
        const m = ascii.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
        if(m){
          const jy=parseInt(m[1],10), jm=parseInt(m[2],10);
          if(Number.isFinite(jy) && jm>=1 && jm<=12){ curY = jy; curM = jm; }
        }
      }catch{}
      place(); pop.style.display='block'; render();
    }
    function hide(){ pop.style.display='none'; try{ hideJalaliPicker(input); }catch{} sanitize(); }
    btnPrev.addEventListener('click', ()=>{ curM--; if(curM<1){ curM=12; curY--; fillYearOptions(curY); } selMonth.value=String(curM); selYear.value=String(curY); render(); });
    btnNext.addEventListener('click', ()=>{ curM++; if(curM>12){ curM=1; curY++; fillYearOptions(curY); } selMonth.value=String(curM); selYear.value=String(curY); render(); });
    selMonth.addEventListener('change', ()=>{ const v=parseInt(selMonth.value,10); if(v>=1&&v<=12){ curM=v; render(); } });
    selYear.addEventListener('change', ()=>{ const v=parseInt(selYear.value,10); if(Number.isFinite(v)){ curY=v; render(); } });
    // Today button selects today's date immediately
    btnToday.addEventListener('click', ()=>{
      try{
        const jy=ty, jm=tM, jd=tD;
        input.value = fmtJalaliYMD(jy,jm,jd,true);
        const alt = altSel ? document.querySelector(altSel) : null;
        const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
        const mm = String(gm).padStart(2,'0'); const dd = String(gd).padStart(2,'0');
        const iso = `${gy}-${mm}-${dd}`;
        if(alt && isValidISO(iso)) alt.value = iso;
      }catch{}
      setWeekday(ty,tM,tD);
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
      updateHint();
      hide();
    });
    input.addEventListener('click', show);
    input.addEventListener('blur', sanitize);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('mousedown', (e)=>{ if(pop.style.display!=='none' && !pop.contains(e.target) && e.target!==input){ hide(); } try{ hideJalaliPicker(input); }catch{} });
  }

  

  // Inject today's date banner under header
  function renderTodayBanner(){
    try{
      let host = document.getElementById('todayBanner');
      if(!host){
        const header = document.querySelector('header.head');
        if(header){
          host = document.createElement('div');
          host.id = 'todayBanner';
          host.className = 'small';
          host.style.marginTop = '6px';
          host.style.lineHeight = '1.2';
          header.appendChild(host);
        }else{
          return;
        }
      }
      const d = new Date();
      // Persian month name and day using Persian calendar
      let faMonth = '', faDay = '';
      try{
        faMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month:'long' }).format(d);
        faDay = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day:'2-digit' }).format(d);
      }catch{}
      // English line (e.g., Tue, 19 Aug 2025)
      let en = '';
      try{
        const EN_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const EN_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        const yy = d.getFullYear();
        const mm = EN_MON[d.getMonth()];
        const dd = String(d.getDate()).padStart(2,'0');
        const dow = EN_DOW[d.getDay()];
        en = `${dow}, ${dd} ${mm} ${yy}`;
      }catch{}
      host.innerHTML = `
        <div class="cal-card" aria-label="تاریخ امروز">
          <div class="cal-top">${faMonth||''}</div>
          <div class="cal-body">
            <div class="cal-day">${faDay||''}</div>
            <div class="cal-en small">${en||''}</div>
          </div>
        </div>`;
    }catch{}
  }

  // Show last backup time under the download button (uses Backup.js)
  async function refreshLastBackupHint(){
    try{
      const el = document.getElementById('lastBackupHint');
      if(!el) return;
      let isoDate = '';
      try{ isoDate = await window.Backup?.getLatestISO?.() || ''; }catch{}
      if(!isoDate){
        // fallback to LS timestamp if any
        const last = localStorage.getItem('dk_last_backup_at');
        if(last) isoDate = String(last).slice(0,10);
      }
      if(!isoDate){ el.textContent = '—'; return; }
      const iso = `${isoDate}T00:00:00.000Z`;
      const fa = fmtFaDate(iso);
      const en = fmtEnDate(iso);
      el.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '—');
    }catch{}
  }

  // Info modal (read-only content), returns when closed
  // overlayHtml (optional): extra HTML absolutely positioned inside modal (e.g., a stamp)
  function infoFa(title, bodyHtml, { okText='بستن' }={}, overlayHtml=''){
    return new Promise((resolve)=>{
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      wrap.innerHTML = `
        <div class="modal info" style="min-width:320px">
          ${overlayHtml||''}
          <div class="modal-body">
            <h3 class="info-title">${title||''}</h3>
            <div class="info-body">${bodyHtml||''}</div>
          </div>
          <div class="modal-actions">
            <button class="btn" data-ok>${okText}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const done = ()=>{ try{ document.body.removeChild(wrap); }catch{} resolve(); };
      wrap.querySelector('[data-ok]')?.addEventListener('click', done);
      // do NOT close on overlay click
      wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
    });
  }

  // Password prompt (masked with eye toggle). Returns the entered string or null on cancel.
  function promptFaPassword(message, { okText='تایید', cancelText='انصراف', defaultValue='' }={}){
    return new Promise((resolve)=>{
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      wrap.style.position = 'fixed'; wrap.style.inset = '0'; wrap.style.background = 'rgba(0,0,0,.45)';
      wrap.style.display = 'flex'; wrap.style.alignItems = 'center'; wrap.style.justifyContent = 'center'; wrap.style.zIndex = '99999';
      wrap.innerHTML = `
        <div class="modal" style="background:#111a2b; color:#e5ecff; border:1px solid #25324a; border-radius:12px; padding:16px; min-width:260px; max-width:90vw; box-shadow:0 20px 50px rgba(0,0,0,.5); direction:rtl">
          <div class="modal-body" style="margin-bottom:12px">
            <div style="margin-bottom:8px">${message}</div>
            <div style="position:relative">
              <input class="modal-input" type="password" value="${defaultValue}" style="width:100%; background:#14213a; color:#e5ecff; border:1px solid #25324a; border-radius:8px; padding:8px 36px 8px 10px" />
              <button type="button" class="pw-eye" aria-label="نمایش/مخفی" style="position:absolute; inset-inline-end:6px; top:50%; transform:translateY(-50%); background:transparent; border:0; color:#bcd0ff; cursor:pointer">👁️</button>
            </div>
          </div>
          <div class="modal-actions" style="display:flex; gap:8px; justify-content:flex-end">
            <button class="btn" data-ok style="background:#16233a; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${okText}</button>
            <button class="btn ghost" data-cancel style="background:transparent; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${cancelText}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const inp = wrap.querySelector('.modal-input');
      const eye = wrap.querySelector('.pw-eye');
      try{ inp?.focus(); inp?.select(); }catch{}
      const done = (val)=>{ try{ document.body.removeChild(wrap); }catch{} resolve(val); };
      wrap.querySelector('[data-ok]')?.addEventListener('click', ()=>{ done(String(inp?.value||'')); });
      wrap.querySelector('[data-cancel]')?.addEventListener('click', ()=> done(null));
      eye?.addEventListener('click', ()=>{
        try{
          if(!inp) return;
          const isPw = inp.getAttribute('type') === 'password';
          inp.setAttribute('type', isPw ? 'text' : 'password');
          eye.textContent = isPw ? '🙈' : '👁️';
        }catch{}
      });
      // Enter key submits
      inp?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); wrap.querySelector('[data-ok]')?.dispatchEvent(new Event('click')); }});
      // do NOT close on overlay click
      wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
    });
  }

  // (moved inside IIFE below)
  function promptFaNumber(message, { okText='تایید', cancelText='انصراف', defaultValue='1' }={}){
    return new Promise((resolve)=>{
      const wrap = document.createElement('div');
      wrap.className = 'modal-wrap';
      // Inline fallback styles to ensure centering
      wrap.style.position = 'fixed';
      wrap.style.inset = '0';
      wrap.style.background = 'rgba(0,0,0,.45)';
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'center';
      wrap.style.zIndex = '99999';
      wrap.innerHTML = `
        <div class="modal" style="background:#111a2b; color:#e5ecff; border:1px solid #25324a; border-radius:12px; padding:16px; min-width:260px; max-width:90vw; box-shadow:0 20px 50px rgba(0,0,0,.5); direction:rtl">
          <div class="modal-body" style="margin-bottom:12px"><div>${message}</div><input class="modal-input" inputmode="numeric" value="${defaultValue}" style="width:100%; background:#14213a; color:#e5ecff; border:1px solid #25324a; border-radius:8px; padding:8px 10px; margin-top:10px" /></div>
          <div class="modal-actions" style="display:flex; gap:8px; justify-content:flex-end">
            <button class="btn" data-ok style="background:#16233a; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${okText}</button>
            <button class="btn ghost" data-cancel style="background:transparent; color:#e5ecff; border:1px solid #25324a; padding:8px 12px; border-radius:10px">${cancelText}</button>
          </div>
        </div>`;
      document.body.appendChild(wrap);
      const inp = wrap.querySelector('.modal-input');
      try{ inp?.focus(); inp?.select(); }catch{}
      const done = (val)=>{ try{ document.body.removeChild(wrap); }catch{} resolve(val); };
      wrap.querySelector('[data-ok]')?.addEventListener('click', ()=>{
        // Inline Persian/Arabic-Indic to ASCII digit normalization to avoid external dependency
        const src = String(inp?.value||'');
        const digitMap = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
        let raw = '';
        for(const ch of src) raw += (digitMap[ch] ?? ch);
        const n = parseInt(raw,10);
        if(Number.isFinite(n) && n>0) done(n); else done(null);
      });
      wrap.querySelector('[data-cancel]')?.addEventListener('click', ()=> done(null));
      // Submit on Enter key for better UX
      try{
        inp?.addEventListener('keydown', (e)=>{
          if(e.key==='Enter'){
            e.preventDefault();
            const okBtn = wrap.querySelector('[data-ok]');
            okBtn?.dispatchEvent(new Event('click')); 
          }
        });
      }catch{}
      // do NOT close on overlay click
      wrap.addEventListener('click', (e)=>{ if(e.target===wrap){ e.stopPropagation(); } });
    });
  }
// app.js — دفتر کل قرض‌ها (localStorage)
(function(){
  // Storage keys and DOM selector constants
  const LS_KEYS = { loans: 'dk::loans', pays: 'dk::payments', meta: 'dk::meta' };
  const IDS = {
    loanForm: '#loanForm',
    paymentForm: '#paymentForm',
    loansTable: '#loansTable',
    paymentsTable: '#paymentsTable',
    creditorPreset: '#creditorPreset',
    creditor: '#creditor',
    creditorBackBtn: '#creditorBackBtn',
    borrower: '[name="borrower"]',
    startDate: '#startDate',
    startDateAlt: '#startDateAlt',
    startDateHint: '#startDateHint',
    principalInput: '#principalInput',
    principalWords: '#principalWords',
    rateMonthlyPct: '#rateMonthlyPct',
    rateAnnualPct: '#rateAnnualPct',
    interestEveryMonths: '#interestEveryMonths',
    interestPayoutMode: '#interestPayoutMode',
    expectedInterestLabel: '#expectedInterestLabel',
    expectedInterestAmount: '#expectedInterestAmount',
    repaymentDate: '#repaymentDate',
    repaymentDateAlt: '#repaymentDateAlt',
    repaymentDateHint: '#repaymentDateHint',
    aprHint: '#aprHint',
    submitLoanBtn: '#submitLoanBtn',
    cancelEditLoan: '#cancelEdit',
    loanSelect: '#loanSelect',
    payDate: '#payDate',
    payDateAlt: '#payDateAlt',
    payDateHint: '#payDateHint',
    payAmountInput: '#payAmountInput',
    payAmountWords: '#payAmountWords',
    submitPayBtn: '#submitPayBtn',
    cancelPayEdit: '#cancelPayEdit',
    payFilterBorrower: '#payFilterBorrower',
    payFilterType: '#payFilterType',
    payFilterFrom: '#payFilterFrom',
    payFilterFromAlt: '#payFilterFromAlt',
    payFilterTo: '#payFilterTo',
    payFilterToAlt: '#payFilterToAlt',
    payFilterClear: '#payFilterClear'
  };

  // --- Joint creditor UI (سارا و رضا مشترک) ---
  // Extra field IDs
  const JOINT_IDS = {
    blockPrincipal: '#jointPrincipalFields',
    principalSara: '#principalSaraInput',
    principalReza: '#principalRezaInput',
    blockInterest: '#jointInterestFields',
    interestSara: '#expectedInterestSara',
    interestReza: '#expectedInterestReza',
  };

  function normalizeDigitsToAscii(str){
    try{
      const map = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
      let out=''; for(const ch of String(str||'')) out += (map[ch] ?? ch); return out;
    }catch{ return String(str||''); }
  }
  function parseMoney(val){
    try{ const s = normalizeDigitsToAscii(val).replace(/[^0-9.-]/g,''); const n = parseFloat(s||'0'); return Number.isFinite(n)? n : 0; }catch{ return 0; }
  }


  function isJointSelected(){
    try{
      const selEl = document.querySelector(IDS.creditorPreset);
      const preset = (selEl?.value || '').trim().toLowerCase();
      if(preset === 'joint') return true;
      // Fallback: detect by selected option label text containing "مشترک"
      if(preset && preset !== 'manual'){
        const optText = selEl && selEl.options && selEl.selectedIndex>=0 ? (selEl.options[selEl.selectedIndex].textContent||'') : '';
        if(/مشترک/.test(optText)) return true;
      }
      if(preset === 'manual'){
        const name = (document.querySelector(IDS.creditor)?.value || '').trim();
        return /مشترک/.test(name);
      }
      return false;
    }catch{ return false; }
  }
  // Expose for console early as well
  try{ window.dkIsJoint = isJointSelected; }catch{}

  function computeExpectedByMode(totalPrincipal, rateMonthlyPct, interestEveryMonths, payoutMode){
    try{
      const monthlyRate = Number(rateMonthlyPct||0)/100;
      const k = (parseInt(String(payoutMode??1),10)===0)
        ? (parseInt(String(interestEveryMonths||0),10) || 0)
        : (parseInt(String(payoutMode||1),10) || 1);
      return Math.max(0, Math.round(Number(totalPrincipal||0) * monthlyRate * k));
    }catch{ return 0; }
  }

  function updateJointComputed(){
    try{
      const $s = document.querySelector(JOINT_IDS.principalSara);
      const $r = document.querySelector(JOINT_IDS.principalReza);
      const $main = document.querySelector(IDS.principalInput);
      const $ei = document.querySelector(IDS.expectedInterestAmount);
      const $eiS = document.querySelector(JOINT_IDS.interestSara);
      const $eiR = document.querySelector(JOINT_IDS.interestReza);
      const rate = parseMoney(document.querySelector(IDS.rateMonthlyPct)?.value || '0');
      const every = parseNum(document.querySelector(IDS.interestEveryMonths)?.value || '0');
      const mode = parseInt(String(document.querySelector(IDS.interestPayoutMode)?.value||'1'),10);
      const vS = parseMoney($s?.value || '0');
      const vR = parseMoney($r?.value || '0');
      const total = Math.max(0, Math.round(vS + vR));
      const currentMain = parseNum($main?.value||'0');
      // Only mirror split into principal when user actually provided a split (>0)
      if($main && total>0){
        $main.value = faFormatInt(total);
        try{ console.debug('[DK][joint->main]', 'sum:', total, 'set main to:', $main.value); }catch{}
        try{ $main.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
      }
      const basePrincipal = total>0 ? total : currentMain;
      const expectedTotal = computeExpectedByMode(basePrincipal, rate, every, mode);
      const shareS = total>0 ? Math.round(expectedTotal * (vS/total)) : 0;
      const shareR = total>0 ? Math.round(expectedTotal * (vR/total)) : 0;
      if($ei) $ei.value = faFormatInt(expectedTotal);
      if($eiS) $eiS.value = faFormatInt(shareS);
      if($eiR) $eiR.value = faFormatInt(shareR);
    }catch{}
  }

  function toggleJointUI(){
    try{
      const on = isJointSelected();
      const blockP = document.querySelector(JOINT_IDS.blockPrincipal);
      const blockI = document.querySelector(JOINT_IDS.blockInterest);
      const main = document.querySelector(IDS.principalInput);
      const loanFormEl = document.querySelector(IDS.loanForm);
      const isEditingLoan = !!(loanFormEl && loanFormEl.classList && loanFormEl.classList.contains('editing')) || !!window._dkEditingLoan;
      if(on){ document.body.classList.add('joint-mode'); } else { document.body.classList.remove('joint-mode'); }
      if(blockP){ blockP.style.display = on? 'flex' : 'none'; if(on) blockP.setAttribute('style','display:flex'); }
      if(blockI){ blockI.style.display = on? 'flex' : 'none'; if(on) blockI.setAttribute('style','display:flex'); }
      if(main){
        main.readOnly = on; // total mirrors from split
        try{ if(on) main.setAttribute('readonly',''); else main.removeAttribute('readonly'); }catch{}
      }
      if(on) updateJointComputed();
      else{
        // clear joint-only computed values when hidden
        try{
          if(isEditingLoan) return; // do not clear while editing an existing loan
          const $s = document.querySelector(JOINT_IDS.principalSara);
          const $r = document.querySelector(JOINT_IDS.principalReza);
          const $eiS = document.querySelector(JOINT_IDS.interestSara);
          const $eiR = document.querySelector(JOINT_IDS.interestReza);
          if($s) $s.value = '';
          if($r) $r.value = '';
          if($eiS) $eiS.value = '';
          if($eiR) $eiR.value = '';
          if(main){ main.readOnly = false; try{ main.removeAttribute('readonly'); }catch{} }
        }catch{}
      }
    }catch{}
  }

  function bindJointFields(){
    try{
      const sel = document.querySelector(IDS.creditorPreset);
      sel?.addEventListener('change', ()=>{ toggleJointUI(); });
      sel?.addEventListener('input', ()=>{ toggleJointUI(); });
      sel?.addEventListener('click', ()=>{ setTimeout(()=>{ try{ toggleJointUI(); }catch{} }, 0); });
      document.querySelector(IDS.creditor)?.addEventListener('input', ()=>{ toggleJointUI(); });
      [JOINT_IDS.principalSara, JOINT_IDS.principalReza].forEach(sel=>{
        const el = document.querySelector(sel); if(!el) return;
        // Attach same numeric formatter pattern as principalInput
        try{
          const wordsEl = (sel===JOINT_IDS.principalSara) ? document.getElementById('principalSaraWords') : document.getElementById('principalRezaWords');
          attachNumericFormatter(el, wordsEl);
        }catch{}
        // Strengthen: update on multiple events to ensure live formatting always applies
        ['input','keyup','change','blur'].forEach(evt=>{ try{ el.addEventListener(evt, updateJointComputed); }catch{} });
        // Force an initial format pass if there is any prefilled value
        try{ el.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
      });
      [IDS.rateMonthlyPct, IDS.interestEveryMonths, IDS.interestPayoutMode].forEach(sel=>{
        const el = document.querySelector(sel); if(!el) return;
        el.addEventListener('input', updateJointComputed);
        el.addEventListener('change', updateJointComputed);
      });
      // Initialize
      toggleJointUI();
      // Fire a synthetic change so any other listeners also run
      sel?.dispatchEvent(new Event('change', { bubbles:true }));
      // In case layout/styles apply late, re-check shortly after
      setTimeout(()=>{ try{ toggleJointUI(); }catch{} }, 120);
      setTimeout(()=>{ try{ toggleJointUI(); }catch{} }, 500);
      // Short polling for 3s to ensure first selection applies
      let t0 = Date.now();
      const iv = setInterval(()=>{
        try{
          toggleJointUI();
          if(Date.now() - t0 > 3000) clearInterval(iv);
        }catch{ clearInterval(iv); }
      }, 200);
      // Observe dynamic changes to the select (e.g., options injected)
      try{
        if(sel){
          const mo = new MutationObserver(()=>{ try{ toggleJointUI(); }catch{} });
          mo.observe(sel, { attributes:true, childList:true, subtree:true, characterData:true });
        }
      }catch{}
      // As a final safety, run a formatting pass for joint fields after DOM has settled
      setTimeout(()=>{
        try{
          const s = document.getElementById('principalSaraInput');
          const r = document.getElementById('principalRezaInput');
          if(s) s.dispatchEvent(new Event('input', { bubbles:true }));
          if(r) r.dispatchEvent(new Event('input', { bubbles:true }));
        }catch{}
      }, 600);
      // Expose for console debugging
      try{ window.dkToggleJoint = toggleJointUI; window.dkIsJoint = isJointSelected; }catch{}
    }catch{}
  }

  // --- Date self-tests (detect off-by-one regressions) ---
  function runDateSelfTests(){
    const fails = [];
    const t = (name, cond, extra)=>{ if(!cond){ fails.push(name + (extra? (' :: ' + extra):'')); } };
    try{
      // 1) Known mapping: 1404/05/29 -> 2025-08-20
      try{
        const [gy, gm, gd] = jalaliToGregorian(1404, 5, 29);
        const mm = String(gm).padStart(2,'0');
        const dd = String(gd).padStart(2,'0');
        const iso = `${gy}-${mm}-${dd}`;
        t('J2G 1404/05/29 => 2025-08-20', iso === '2025-08-20', iso);
        t('fmtEnDate 2025-08-20', fmtEnDate('2025-08-20') === '20 Aug 2025', fmtEnDate('2025-08-20'));
        const fa = fmtFaDate('2025-08-20');
        t('fmtFaDate contains ۲۹', /۲۹/.test(fa), fa);
        t('fmtFaDate contains مرداد', /مرداد/.test(fa), fa);
        t('fmtFaDate contains ۱۴۰۴', /۱۴۰۴/.test(fa), fa);
      }catch(e){ fails.push('exception in known mapping: ' + (e && e.message)); }
      // 2) Month boundary check: addDaysISO consistency
      try{
        const a = addDaysISO('2025-02-28', 1);
        t('addDaysISO leapless Feb', a === '2025-03-01', a);
      }catch(e){ fails.push('exception addDaysISO'); }
      // 3) ISO validators
      t('isValidISO ok', isValidISO('2025-08-20')===true);
      t('isValidISO bad', isValidISO('2025-8-20')===false);
    }catch(e){ fails.push('self-test harness error'); }

    if(fails.length){
      try{ console.error('[DK][self-test] Date tests FAILED:', fails); }catch{}
      // Render a small red banner under header so it's visible in UI
      try{
        const header = document.querySelector('header.head');
        if(header && !document.getElementById('dateSelfTestBanner')){
          const el = document.createElement('div');
          el.id = 'dateSelfTestBanner';
          el.style.cssText = 'margin-top:6px; padding:6px 10px; border-radius:8px; background:rgba(239,68,68,.15); border:1px solid rgba(239,68,68,.4); color:#fecaca; font-size:12px;';
          el.textContent = 'Date self-test failed. Please report. Fails: ' + fails.join(' | ');
          header.appendChild(el);
        }
      }catch{}
    }else{
      try{ console.log('[DK][self-test] Date tests passed'); }catch{}
    }
  }

  // Add N days to ISO date (YYYY-MM-DD) in UTC, return ISO YYYY-MM-DD
  const addDaysISO = (iso, n)=>{
    try{
      if(!iso) return '';
      const [y,m,d] = iso.split('-').map(x=>parseInt(x,10));
      const dt = new Date(Date.UTC(y, (m-1), d));
      dt.setUTCDate(dt.getUTCDate() + Number(n||0));
      const yy = dt.getUTCFullYear();
      const mm = String(dt.getUTCMonth()+1).padStart(2,'0');
      const dd = String(dt.getUTCDate()).padStart(2,'0');
      return `${yy}-${mm}-${dd}`;
    }catch{ return iso }
  };

  // Open payment form for a specific loanId: preselect loan, set type=interest, set today's date, trigger auto-fill, scroll into view
  function openPaymentFormForLoan(loanId){
    try{
      const pf = document.querySelector(IDS.paymentForm);
      // ensure new-entry mode
      try{
        const submitBtn = document.querySelector(IDS.submitPayBtn);
        const cancelBtn = document.querySelector(IDS.cancelPayEdit);
        if(submitBtn) submitBtn.textContent = 'ثبت پرداخت';
        if(cancelBtn) cancelBtn.style.display = 'none';
        pf?.classList.remove('editing');
      }catch{}

      // 1) select loan
      const sel = document.querySelector(IDS.loanSelect);
      if(sel){
        const target = String(loanId||'');
        // ensure option exists; if not, rebuild options from current state.loans
        if(!Array.from(sel.options||[]).some(o=> String(o.value)===target)){
          try{
            const loansAll = (state && Array.isArray(state.loans)) ? state.loans : [];
            // IMPORTANT: include ALL loans here to ensure resolve flow can preselect any loan
            const listForSelect = loansAll;
            const opts = [`<option value="">— انتخاب قرض —</option>`]
              .concat(listForSelect.map(l=>{
                const cred = (l.creditor && String(l.creditor).trim()) || '—';
                const text = `${l.borrower} — ${fmtTom(l.principal)} تومان (${cred})`;
                return `<option value="${l.id}" title="${text}">${text}</option>`;
              }));
            sel.innerHTML = opts.join('');
          }catch{}
        }
        sel.value = target;
        sel.dispatchEvent(new Event('change', { bubbles:true }));
      }

      // 2) set type to interest and trigger change (auto-fill amount)
      try{
        const typeSel = pf?.querySelector('[name="type"]');
        if(typeSel){ typeSel.value = 'interest'; typeSel.dispatchEvent(new Event('change', { bubbles:true })); }
      }catch{}

      // 3) set pay date to today and update hint
      try{
        const todayISO = new Date().toISOString().slice(0,10);
        const alt = document.querySelector(IDS.payDateAlt); if(alt) alt.value = todayISO;
        const hint = document.querySelector(IDS.payDateHint);
        if(hint){ const fa = fmtFaDate(todayISO), en = fmtEnDate(todayISO); hint.textContent = fa && en ? `${fa} — ${en}` : ''; }
        const payInp = document.querySelector(IDS.payDate);
        if(payInp){ try{ payInp.value = fmtFaYMD(todayISO); }catch{} }
      }catch{}

      // 4) focus form
      pf?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(()=>{ try{ document.querySelector(IDS.loanSelect)?.focus(); }catch{} }, 220);
      try{ console.log('[DK][openPaymentFormForLoan]', { loanId, selected: document.querySelector(IDS.loanSelect)?.value }); }catch{}
    }catch{}
  }

  // Debug flag and helper: enable by setting window.DK_DEBUG = true in console
  try{ if(typeof window.DK_DEBUG === 'undefined') window.DK_DEBUG = false; }catch{}
  const dbg = (...args)=>{ try{ if(window.DK_DEBUG) console.log(...args); }catch{} };

  // --- Jalali <-> Gregorian helpers (lightweight) ---
  // Ported minimal jalaliToGregorian from jalaali-js (MIT)
  function div(a,b){ return Math.floor(a/b); }
  function jalCal(jy){
    const breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    let bl=breaks.length, gy=jy+621, leapJ=-14, jp=breaks[0], jm, jump=0, leap, n, i;
    if(jy<jp||jy>=breaks[bl-1]) return {leap:0, gy:gy, march:0};
    for(i=1;i<bl;i++){ jm=breaks[i]; jump=jm-jp; if(jy<jm) break; leapJ+=div(jump,33)*8+div(jump%33,4); jp=jm; }
    n=jy-jp; leapJ+=div(n,33)*8+div((n%33)+3,4); if((jump%33===4) && (jump-n===4)) leapJ+=1;
    let leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150; let march=20+leapJ-leapG; if(jump-n<6) n=n-jump+div(jump+4,33)*33;
    leap=((n+1)%33)-1; if(leap===-1) leap=4; return {leap:leap, gy:gy, march:march};
  }

  // Handle zero remaining installments resolution flow
  async function resolveZeroInstallments(loanId){
    const loan = state.loans.find(l=> l.id===loanId);
    if(!loan) return;
    const d = computeLoanDerived(loan);
    if(Number(d.remainingInstallments||0) > 0) return; // nothing to do
    // Ask if principal has been repaid
    const repaid = await confirmFa('اقساط سود تمام شده است. آیا اصل پول تسویه شده است؟', { okText:'بله', cancelText:'نه هنوز' });
    if(repaid){
      const loans = state.loans.map(l=> l.id===loan.id ? { ...l, status:'closed' } : l);
      state.loans = loans;
      refreshLoansTable(); refreshPaysTable(); try{ refreshLoansCards && refreshLoansCards(); }catch{} try{ refreshArchiveTable(); }catch{} updateSummary();
      return;
    }
    // Not repaid. Ask if wants to extend
    const extend = await confirmFa('آیا می‌خواهید این قرض تمدید شود؟', { okText:'بله', cancelText:'نه' });
    if(extend){
      const months = await promptFaNumber('برای چند ماه تمدید شود؟ (عدد مثبت)', { defaultValue:'1' });
      if(!(Number(months)>0)){
        try{ await confirmFa('عدد واردشده نامعتبر است.', { okText:'باشه', cancelText:'انصراف' }); }catch{}
        return;
      }
      const loans = state.loans.map(l=>{
        if(l.id!==loan.id) return l;
        const newMonths = (parseInt(String(l.interestEveryMonths||0),10)||0) + months;
        const noteLine = `تمدید ${months} ماه در ${new Date().toISOString().slice(0,10)}`;
        // Recompute repayment date: startDate + newMonths
        const startIso = toISO(l.startDate);
        const newRepay = (startIso && Number(newMonths)>0) ? addMonthsPersian(startIso, newMonths) : (l.repaymentDate||'');
        return { ...l, interestEveryMonths: newMonths, repaymentDate: newRepay, notes: (l.notes? (l.notes+"\n") : '') + noteLine, status: 'open' };
      });
      state.loans = loans;
      refreshLoansTable(); refreshPaysTable(); updateSummary();
      return;
    }
    // awaiting collection
    const loans = state.loans.map(l=> l.id===loan.id ? { ...l, status:'awaiting' } : l);
    state.loans = loans;
    refreshLoansTable(); refreshPaysTable(); try{ refreshLoansCards && refreshLoansCards(); }catch{} updateSummary();
  }
  // Expose resolver for external calls (console/tests/buttons)
  try{ if(typeof window!== 'undefined'){ window.resolveZeroInstallments = resolveZeroInstallments; } }catch{}
  
  // Global helper: resolve action from cards (used as inline onclick fail-safe)
  function dkResolveCard(id){
    try{
      const loan = (state.loans||[]).find(l=> String(l.id)===String(id));
      if(!loan) return;
      const cardEl = document.querySelector(`.loan-card[data-id="${id}"]`);
      const today = new Date().toISOString().slice(0,10);
      let isOverdue=false, rem0=false, awaiting=false;
      let d2 = {};
      try{ d2 = computeLoanDerived(loan)||{}; }catch{}
      try{
        const remInst = Number(d2.remainingInstallments||0);
        const repayISO = (function(){ try{ return toISO(loan.repaymentDate); }catch{ return ''; } })();
        const baseDueISO = d2.nextDue || repayISO || '';
        isOverdue = (remInst>0) && !!baseDueISO && String(baseDueISO) < today;
        rem0 = remInst===0;
      }catch{}
      try{
        const s = String(loan.status||'').toLowerCase();
        const catAttr = cardEl?.dataset?.cat || '';
        const hasAwaitBadge = !!cardEl?.querySelector('.status-badges .badge.awaiting');
        awaiting = (s==='awaiting') || (catAttr==='awaiting') || hasAwaitBadge;
      }catch{}
      try{ console.log('[DK][cards] dkResolveCard', { id, isOverdue, rem0, awaiting, nextDue:(d2.nextDue||''), repayISO:(function(){ try{ return toISO(loan.repaymentDate); }catch{ return ''; } })() }); }catch{}
      if(isOverdue){
        try{ if(typeof openPaymentFormForLoan==='function'){ openPaymentFormForLoan(id); return; } }catch{}
        try{ document.querySelector(`#loansTable button[data-act="loan-pay"][data-id="${id}"]`)?.click(); }catch{}
        return;
      }
      if(rem0 || awaiting){
        try{ resolveZeroInstallments(id); }catch{}
        return;
      }
      try{ document.querySelector(`#loansTable button[data-act="resolve"][data-id="${id}"]`)?.click(); }catch{}
    }catch{}
  }
  try{ if(typeof window!== 'undefined' && typeof window.dkResolveCard!=='function'){ window.dkResolveCard = dkResolveCard; } }catch{}
  function j2d(jy,jm,jd){ const r=jalCal(jy); return g2d(r.gy,3, r.march)+ (jm-1)*31 - div(jm,7)*(jm-7) + jd -1; }
  function g2d(gy,gm,gd){ const d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*((gm+9)%12)+2,5)+gd-34840408; return d - div(div(gy+100100+div(gm-8,6),100)*3,4)+752; }
  function d2g(j){ let j2=4*j+139361631, i=div(j2%146097,4)*4+3; let gd=div((i%1461),4)*5+2; let gm=div(((gd%153)+5),5)+3; let gy=div(j2/146097,4)-100100+div(8-gm,6); gd = div((gd%153),5)+1; return [gy, gm, gd]; }
  // Robust Jalali -> Gregorian using Intl Persian calendar (UTC) to avoid math errors
  (function(){
    let F_Y, F_M, F_D;
    function initFmt(){
      if(!F_Y){
        F_Y = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', year: 'numeric' });
        F_M = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', month: 'numeric' });
        F_D = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: 'UTC', day: 'numeric' });
      }
    }
    function getPersianPartsUTC(d){
      initFmt();
      const jy = parseInt(vj_normalizeDigits(F_Y.format(d)),10);
      const jm = parseInt(vj_normalizeDigits(F_M.format(d)),10);
      const jd = parseInt(vj_normalizeDigits(F_D.format(d)),10);
      return {jy,jm,jd};
    }
    function jalaliToGregorian_intl(jy,jm,jd){
      try{
        // search in [jy+620 .. jy+622] Gregorian years
        for(let gy=jy+620; gy<=jy+622; gy++){
          let d = new Date(Date.UTC(gy,0,1));
          for(let i=0;i<370;i++){
            const p = getPersianPartsUTC(d);
            if(p.jy===jy && p.jm===jm && p.jd===jd){
              return [d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate()];
            }
            d.setUTCDate(d.getUTCDate()+1);
          }
        }
      }catch{}
      return [NaN,NaN,NaN];
    }
    // Override exported converter to robust version
    function jalaliToGregorian(jy,jm,jd){ return jalaliToGregorian_intl(jy,jm,jd); }
    try{ if(typeof window!=='undefined'){ window.jalaliToGregorian = jalaliToGregorian; } }catch{}
    // also expose for internal use
    if(typeof globalThis!=='undefined'){ globalThis.jalaliToGregorian = jalaliToGregorian; }
  })();

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  // Date debug logs removed in clean-up

  // --- Currency label (configurable) ---
  const CURRENCY_LABEL = 'تومان';

  // (Removed duplicate fallback declarations to avoid redeclare errors)

  // --- Roles & Auth helpers ---
  // Configure admin emails here (full access). All other signed-in users are treated as limited users.
  const ADMIN_EMAILS = ['reza.mot2001@gmail.com'];
  function getCurrentUser(){
    try{
      if(__AUTH_USER_CACHE) return __AUTH_USER_CACHE;
      // Prefer custom wrapper
      if(window.firebaseApi && window.firebaseApi.auth && window.firebaseApi.auth.currentUser) return window.firebaseApi.auth.currentUser;
      // Fallback to global firebase SDK (compat)
      if(window.firebase && typeof window.firebase.auth === 'function'){
        const u = window.firebase.auth().currentUser; if(u) return u;
      }
      // Fallback to modular SDK exposed as window.firebaseAuth
      if(window.firebaseAuth && window.firebaseAuth.currentUser) return window.firebaseAuth.currentUser;
      return null;
    }catch{ return null; }
  }
  function isAdminUser(){ try{ const u=getCurrentUser(); if(!u) return false; const e=(u.email||'').toLowerCase(); return ADMIN_EMAILS.includes(e); }catch{ return false; } }

  // Final safety export (in case earlier export didn't run due to order)
  try{
    if(typeof window!=='undefined'){
      if(typeof window.openPaymentFormForLoan !== 'function' && typeof openPaymentFormForLoan === 'function'){
        window.openPaymentFormForLoan = openPaymentFormForLoan;
      }
      if(typeof window.resolveZeroInstallments !== 'function' && typeof resolveZeroInstallments === 'function'){
        window.resolveZeroInstallments = resolveZeroInstallments;
      }
    }
  }catch{}
  function isLimitedUser(){ return !isAdminUser(); }
  function canModifyLoan(loan){
    try{
      if(isAdminUser()) return true;
      // Sister may ONLY modify when creditor is exactly 'سارا'
      const isSara = String(loan && loan.creditor || '').trim()==='سارا';
      return !!isSara;
    }catch{ return false; }
  }
  function canModifyPayment(pay){
    try{
      if(isAdminUser()) return true;
      const loan = state.loans.find(l=> l.id===pay.loanId);
      // Only allowed when the related loan creditor is exactly 'سارا'
      if(loan) return canModifyLoan(loan);
      return false;
    }catch{ return false; }
  }

  const readLS = (k) => {
    try{
      const v = localStorage.getItem(k);
      if(v==null) return (k===LS_KEYS.loans||k===LS_KEYS.pays)? [] : null;
      return JSON.parse(v);
    }catch{ return (k===LS_KEYS.loans||k===LS_KEYS.pays)? [] : null; }
  };
  const writeLS = (k, v) => {
    try{
      localStorage.setItem(k, JSON.stringify(v));
      // Touch lastUpdated whenever loans or payments change
      if(k===LS_KEYS.loans || k===LS_KEYS.pays){
        touchLastUpdated();
      }
    }catch{}
  };

  // --- Activity meta (lastSeen / lastUpdated) ---
  function readMeta(){ try{ return readLS(LS_KEYS.meta) || {}; }catch{ return {}; } }
  function writeMeta(m){ try{ localStorage.setItem(LS_KEYS.meta, JSON.stringify(m||{})); }catch{} }
  function touchLastSeen(){ try{ const m = readMeta(); m.lastSeen = new Date().toISOString(); writeMeta(m); updateActivityBanner(); }catch{} }
  function touchLastUpdated(){ try{ const m = readMeta(); m.lastUpdated = new Date().toISOString(); writeMeta(m); updateActivityBanner(); }catch{} }
  function fmtFaDateTimeISO(iso){ try{ const d=new Date(iso); return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle:'medium', timeStyle:'short' }).format(d);}catch{return ''} }
  function fmtEnDateTimeISO(iso){ try{ const d=new Date(iso); return new Intl.DateTimeFormat('en-US', { dateStyle:'medium', timeStyle:'short' }).format(d);}catch{return ''} }
  function ensureActivityHost(){
    try{
      let host = document.getElementById('activityBanner');
      if(!host){
        const meta = document.querySelector('header.head .head-meta');
        const sub = meta ? meta.querySelector('.sub') : null;
        host = document.createElement('div');
        host.id='activityBanner'; host.className='small';
        host.style.cssText='display:block; margin-top:4px; color:var(--muted)';
        if(sub && sub.parentNode){
          sub.parentNode.insertBefore(host, sub.nextSibling);
        }else if(meta){
          meta.appendChild(host);
        }
      }
      return host;
    }catch{ return null }
  }
  function updateActivityBanner(){
    try{
      const h = ensureActivityHost(); if(!h) return;
      const m = readMeta(); const ls = m && m.lastSeen ? m.lastSeen : '';
      const lu = m && m.lastUpdated ? m.lastUpdated : '';
      const lsFa = ls ? fmtFaDateTimeISO(ls) : '—';
      const luFa = lu ? fmtFaDateTimeISO(lu) : '—';
      h.textContent = `آخرین مشاهده: ${lsFa} • آخرین به‌روزرسانی: ${luFa}`;
    }catch{}
  }

  // Payment group persistence removed per request: groups default to collapsed on render

  // IndexedDB helpers (lightweight KV store) — used to increase persistence reliability
  // We keep localStorage as the primary sync API and mirror to IDB; on load, if LS is empty we restore from IDB.
  const IDB_DB_NAME = 'daftar_kol';
  const IDB_STORE = 'kv';
  function openDb(){
    return new Promise((resolve, reject)=>{
      try{
        const req = indexedDB.open(IDB_DB_NAME, 1);
        req.onupgradeneeded = ()=>{
          try{
            const db = req.result;
            if(!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE, { keyPath: 'key' });
          }catch{}
        };
        req.onsuccess = ()=> resolve(req.result);
        req.onerror = ()=> reject(req.error);
      }catch(e){ resolve(null); }
    });
  }
  async function idbSet(key, value){
    try{
      const db = await openDb(); if(!db) return;
      await new Promise((res)=>{
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.oncomplete = ()=>{ try{ db.close(); }catch{}; res(); };
        tx.onabort = ()=>{ try{ db.close(); }catch{}; res(); };
        tx.onerror = ()=>{ try{ db.close(); }catch{}; res(); };
        const store = tx.objectStore(IDB_STORE);
        try{ store.put({ key, value }); }catch{ try{ store.put({ key, value: value }); }catch{} }
      });
    }catch{}
  }
  async function idbGet(key){
    try{
      const db = await openDb(); if(!db) return undefined;
      return await new Promise((res)=>{
        const tx = db.transaction(IDB_STORE, 'readonly');
        tx.oncomplete = ()=>{ try{ db.close(); }catch{} };
        tx.onabort = ()=>{ try{ db.close(); }catch{} };
        tx.onerror = ()=>{ try{ db.close(); }catch{} };
        const store = tx.objectStore(IDB_STORE);
        const r = store.get(key);
        r.onsuccess = ()=> res(r.result ? r.result.value : undefined);
        r.onerror = ()=> res(undefined);
      });
    }catch{ return undefined; }
  }

  // [removed] Legacy downloadLatestBackup() is superseded by Backup.downloadLatestBackup()

  // -------- Auto Backup (weekly) to OPFS (/backups/*.json) --------
  function exportDataObject(){
    const obj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      loans: Array.isArray(state.loans)? state.loans : [],
      payments: Array.isArray(state.pays)? state.pays : []
    };
    return obj;
  }
  // [removed] Legacy ensureBackupsDir() — handled in backup.js
  // [removed] Legacy isoDateOnly() — defined where needed in backup.js
  // [removed] Legacy writeWeeklyBackupIfDue() — handled by Backup.writeWeeklyBackupIfDue()

  const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  // --- utilities ---
  /**
   * Simple debounce utility.
   * @template {(...args:any[])=>any} F
   * @param {F} fn
   * @param {number} wait
   * @returns {F}
   */
  function debounce(fn, wait){
    let t = null;
    return function(...args){
      if(t) clearTimeout(t);
      t = setTimeout(()=>{ fn.apply(this, args); }, wait);
    };
  }

  // Attempt to make storage persistent to reduce eviction risk by the browser/OS
  async function persistStorageIfPossible(){
    try{
      // Feature detection
      if(!('storage' in navigator)) return;
      const ns = navigator.storage;
      if(!ns) return;
      // If already persisted, skip
      let already = false;
      try{ already = typeof ns.persisted === 'function' ? await ns.persisted() : false; }catch{}
      if(already) return;
      // Request persistence (may require user gesture depending on browser policy)
      if(typeof ns.persist === 'function'){
        const granted = await ns.persist();
        try{ dbg('Storage persistence', granted ? 'granted' : 'denied'); }catch{}
      }
    }catch{}
  }

  // Normalize numerals (Latin, Persian, Arabic-Indic) to plain Latin digits
  const normalizeDigits = (s)=>{
    if(s==null) return '';
    const map = {
      '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
      '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
    };
    let out = '';
    for(const ch of String(s)) out += (map[ch] ?? ch);
    return out;
  };
  const parseNum = (v) => {
    if(v==null) return 0;
    const latin = normalizeDigits(v).replace(/[^0-9.-]/g,'');
    const n = Number(latin);
    return Number.isFinite(n)? n: 0;
  };
  const toFaDigits = (s)=>{
    const map = {'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
    let t=''; for(const ch of String(s)) t += (map[ch] ?? ch); return t;
  };
  const faFormatInt = (n)=> toFaDigits(Number(n).toLocaleString('en-US')); // with separators, digits as fa

  // Generic helper: convert any ASCII digits in a string to Persian digits
  const asciiToFa = (str)=> toFaDigits(String(str||''));
  // Attach auto Persian-digits conversion for all inputs/textareas under a root element
  function attachAutoFaDigitsWithin(root){
    if(!root) return;
    const skipIds = new Set(['principalInput','rateMonthlyPct','rateAnnualPct','interestEveryMonths','payAmountInput','principalSaraInput','principalRezaInput']);
    const fields = root.querySelectorAll('input:not([type="hidden"]):not([readonly]), textarea');
    fields.forEach(el=>{
      // Avoid double-binding
      if(el._faDigitsBound) return;
      if(el.id && skipIds.has(el.id)) { el._faDigitsBound = true; return; }
      // Convert on blur/change to avoid interfering with typing on some keyboards
      const handler = ()=>{
        try{
          const val = String(el.value||'');
          // Fast path: no ASCII digits
          if(!/[0-9]/.test(val)) return;
          const start = el.selectionStart, end = el.selectionEnd;
          const fa = asciiToFa(val);
          if(fa !== val){
            el.value = fa;
            // try to preserve caret position roughly
            try{ el.setSelectionRange(start, end); }catch{}
          }
        }catch{}
      };
      el.addEventListener('blur', handler);
      el.addEventListener('change', handler);
      el._faDigitsBound = true;
    });
  }

  // Map interest payout mode to Persian label
  const modeLabel = (modeVal)=>{
    switch(Number(modeVal)){
      case 0: return 'در سررسید';
      case 1: return 'ماهانه';
      case 2: return 'دو ماه یک‌بار';
      case 3: return 'سه ماه یک‌بار';
      default: return '—';
    }
  };

  // Debounced variant for reactive inputs
  const refreshPaysTableDebounced = debounce(refreshPaysTable, 150);

  // Date helpers
  // Be robust to timezone: validate format YYYY-MM-DD and that it maps to a real calendar date
  const isValidISO = (iso)=>{
    if(!iso) return false;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [y,m,d] = iso.split('-').map(n=> parseInt(n,10));
    // Construct in UTC to avoid TZ shifts
    const dt = new Date(Date.UTC(y, m-1, d));
    return dt.getUTCFullYear()===y && (dt.getUTCMonth()+1)===m && dt.getUTCDate()===d;
  };
  const compareISO = (a,b)=>{
    if(!isValidISO(a) || !isValidISO(b)) return NaN;
    return a.localeCompare(b);
  };
  // Inline validation helper
  const showInvalid = (el, msg)=>{
    try{
      if(!el) return;
      el.setCustomValidity(msg||'');
      el.reportValidity();
      el.focus();
    }catch{}
  };

  // Decimal helpers for number inputs (keep ASCII digits and '.' only)
  const normalizeDecimalAscii = (s)=>{
    const str = String(s ?? '');
    // convert Persian/Arabic digits to Latin, then unify decimal separators to '.' and strip others
    const digits = normalizeDigits(str)
      .replace(/[\u066B\u060C،,]/g, '.') // Arabic decimal sep, Arabic/Latin comma -> dot
      .replace(/[^0-9.]/g, '');
    // keep only the first dot
    return digits.replace(/\.(?=.*\.)/g, '');
  };
  // Display helper: keep '.' but show Persian digits in the field
  const attachDecimalFaDot = (inputEl, opts={})=>{
    if(!inputEl) return;
    const appendPercent = opts.appendPercent === true;
    const percentPrefix = opts.percentPrefix === true; // if true, place % before the number
    inputEl.addEventListener('input', ()=>{
      try{
        const ascii = normalizeDecimalAscii(inputEl.value);
        const fa = toFaDigits(ascii); // Persian digits, '.' intact
        if(appendPercent && fa !== ''){
          inputEl.value = percentPrefix ? ('٪' + fa) : (fa + '٪');
        }else{
          inputEl.value = fa;
        }
      }catch{}
    });
  };

  // Attach formatter for numeric inputs that should
  // - accept Persian/Arabic-Indic digits
  // - apply thousand separators
  // - optionally show the amount in words (Persian) with "تومان"
  function attachNumericFormatter(inputEl, wordsEl){
    if(!inputEl) return;
    // Local helpers (self-contained)
    const toAsciiDigits = (str)=>{
      const s = String(str||'');
      const map = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
      let out=''; for(const ch of s) out += (map[ch] ?? ch); return out;
    };
    const parseIntSafe = (str)=>{ try{ const n = parseInt(String(str||'').replace(/[^0-9]/g,''),10); return Number.isFinite(n)? n : 0; }catch{ return 0; } };
    inputEl.addEventListener('input', ()=>{
      try{
        const raw = toAsciiDigits(inputEl.value).replace(/[^0-9]/g,'');
        const latin = raw.replace(/^0+(?!$)/,'');
        try{ console.debug('[DK][fmt]', inputEl.id||inputEl.name||'input', 'raw:', raw, 'latin:', latin); }catch{}
        if(latin === ''){
          inputEl.value = '';
          if(wordsEl) wordsEl.textContent = '';
          return;
        }
        inputEl.value = faFormatInt(latin);
        try{ console.debug('[DK][fmt:set]', inputEl.id||inputEl.name||'input', 'value:', inputEl.value); }catch{}
        const n = parseIntSafe(latin);
        if(wordsEl) wordsEl.textContent = n? (num2fa(n) + ' ' + CURRENCY_LABEL) : '';
      }catch{}
    });
  }

  // Persian number to words (integer, up to trillions)
  const num2fa = (num)=>{
    num = Math.floor(Math.abs(Number(num)||0));
    if(num===0) return 'صفر';
    const ones = ['','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه'];
    const tens = ['','ده','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
    const teens = ['ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
    const hundreds = ['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
    const scales = ['','هزار','میلیون','میلیارد','تریلیون'];
    const chunk = (n)=>{
      const h = Math.floor(n/100), t = Math.floor((n%100)/10), o = n%10;
      const parts = [];
      if(h) parts.push(hundreds[h]);
      if(t>1){ parts.push(tens[t]); if(o) parts.push(ones[o]); }
      else if(t===1){ parts.push(teens[o]); }
      else if(o){ parts.push(ones[o]); }
      return parts.join(' و ');
    };
    const parts=[]; let i=0;
    while(num>0 && i<scales.length){
      const n = num % 1000;
      if(n){
        const ch = chunk(n);
        parts.unshift(ch + (scales[i]? ' ' + scales[i] : ''));
      }
      num = Math.floor(num/1000); i++;
    }
    return parts.join(' و ');
  };

  const fmtTom = (n) => Number(n).toLocaleString('fa-IR');
  // Robust ISO (YYYY-MM-DD) builder using local time to avoid TZ off-by-one
  const toISO = (s) => {
    try{
      if(!s) return '';
      if(typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = (s instanceof Date) ? s : new Date(s);
      if(!(d instanceof Date) || isNaN(d)) return '';
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const day = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }catch{ return '' }
  };
  // expose for utils modules (e.g., resolve-card.js)
  try{ if(typeof window!=='undefined'){ window.toISO = toISO; } }catch{}
  // Gregorian-based month addition (keeps day-of-month; clamps to end-of-month)
  const addMonths = (dateStr, m) => {
    const d = new Date(dateStr);
    const t = new Date(d.getTime());
    t.setMonth(t.getMonth() + m);
    // keep day of month stable; if overflowed (e.g., 31 to a 30-day month) clamp to month end
    if(t.getDate() !== d.getDate()) t.setDate(0);
    const y = t.getFullYear();
    const mo = String(t.getMonth()+1).padStart(2,'0');
    const da = String(t.getDate()).padStart(2,'0');
    return `${y}-${mo}-${da}`;
  };

  // Month difference between two ISO dates (by year/month, counting current month if end day >= start day)
  const monthsDiff = (isoStart, isoEnd)=>{
    try{
      if(!isoStart || !isoEnd) return 0;
      const s = new Date(isoStart), e = new Date(isoEnd);
      let total = (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth());
      if(e.getDate() >= s.getDate()) total += 1;
      return Math.max(0, total);
    }catch{ return 0; }
  };

  // Date formatting helpers (Persian calendar + Gregorian)
  const fmtFaDate = (iso)=>{
    if(!iso) return '';
    try{
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return '';
      const gy=Number(m[1]), gm=Number(m[2]), gd=Number(m[3]);
      const ms = Date.UTC(gy, gm-1, gd);
      // Use Intl Persian calendar in UTC exclusively to avoid TZ/library drift
      const d = new Date(ms);
      return d.toLocaleDateString('fa-IR-u-ca-persian', { timeZone:'UTC', year:'numeric', month:'long', day:'numeric' });
    }catch{return ''}
  };
  const fmtEnDate = (iso)=>{
    if(!iso) return '';
    try{
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2])-1, Number(m[3]))) : new Date(iso);
      // Manual formatter: DD Mon YYYY (always available)
      const EN_MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const yy = d.getUTCFullYear();
      const mm = d.getUTCMonth();
      const dd = String(d.getUTCDate()).padStart(2,'0');
      return `${dd} ${EN_MON[mm]} ${yy}`;
    }catch{return ''}
  };
  const bothDatesHTML = (iso)=>{
    const fa = fmtFaDate(iso), en = fmtEnDate(iso);
    if(!fa && !en) return '—';
    return `<div>${fa}</div><div class="small" style="opacity:.8">${en}</div>`;
  };
  const fmtFaYMD = (iso)=>{
    if(!iso) return '';
    try{
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if(!m) return '';
      const gy=Number(m[1]), gm=Number(m[2]), gd=Number(m[3]);
      const ms = Date.UTC(gy, gm-1, gd);
      // Prefer persianDate
      try{
        const PD = (window && (window.persianDate || window.PersianDate)) || null;
        if(PD){
          const pd = new PD(ms);
          if(pd){
            const fa = (typeof pd.toCalendar==='function') ? pd.toCalendar('persian').format('YYYY/MM/DD') : pd.format('YYYY/MM/DD');
            return toFaDigits(String(fa||''));
          }
        }
      }catch{}
      // Fallback: Intl Persian calendar with UTC
      const d = new Date(ms);
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone:'UTC', year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
    }catch{return ''}
  };

  // Auto-calc repayment date from StartDateAlt + interestEveryMonths (UI-driven)
  function recomputeRepaymentFromUI(){
    try{
      const startAlt = document.querySelector('#startDateAlt');
      const periodEl = document.querySelector('#interestEveryMonths');
      const repayInp = document.querySelector('#repaymentDate');
      const repayAlt = document.querySelector('#repaymentDateAlt');
      const repayHint = document.querySelector('#repaymentDateHint');
      const startISO = startAlt?.value || '';
      const months = parseNum(periodEl?.value || '0');
      if(months>0){
        // Prefer parsing from visible Persian date to avoid TZ drift
        let iso = '';
        const startFaEl = document.querySelector('#startDate');
        const faStr = (startFaEl && startFaEl.value) ? String(startFaEl.value) : '';
        if(faStr){
          const ascii = normalizeDigitsToAscii(faStr).replace(/[^0-9\/\-]/g,'');
          const parts = ascii.split(/[\/\-]/);
          if(parts.length>=3){
            let jy = parseInt(parts[0],10)||0, jm = parseInt(parts[1],10)||0, jd = parseInt(parts[2],10)||0;
            // add months strictly in Jalali
            jm += months;
            while(jm>12){ jm-=12; jy++; }
            while(jm<1){ jm+=12; jy--; }
            const md = jMonthLength(jy, jm);
            if(jd>md) jd = md;
            const g = toGregorian(jy, jm, jd);
            iso = `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;
          }
        }
        // Fallback to ISO-based add if parsing failed
        if(!iso && startISO){ iso = addMonthsPersian(startISO, months); }
        if(repayAlt) repayAlt.value = iso;
        if(repayInp) repayInp.value = fmtFaYMD(iso);
        if(repayHint){ const fa = fmtFaDate(iso), en = fmtEnDate(iso); repayHint.textContent = fa && en ? `${fa} — ${en}` : ''; }
      }else{
        // clear when duration is empty or zero
        if(repayAlt) repayAlt.value = '';
        if(repayInp) repayInp.value = '';
        if(repayHint) repayHint.textContent = '';
      }
    }catch{}
  }

  const state = {
    get loans(){ return readLS(LS_KEYS.loans); },
    set loans(v){ writeLS(LS_KEYS.loans, v); try{ idbSet(LS_KEYS.loans, v); }catch{} },
    get pays(){ return readLS(LS_KEYS.pays); },
    set pays(v){ writeLS(LS_KEYS.pays, v); try{ idbSet(LS_KEYS.pays, v); }catch{} }
  };
  // Expose reactive state to other scripts (used by firebase.js)
  try{ window.state = state; }catch{}

  // On startup, if LS is empty but IDB has data, restore from IDB into LS (and keep mirroring going forward)
  async function restoreFromIDBIfEmpty(){
    try{
      const lsLoans = readLS(LS_KEYS.loans);
      const lsPays = readLS(LS_KEYS.pays);
      const isEmpty = (!Array.isArray(lsLoans) || lsLoans.length===0) && (!Array.isArray(lsPays) || lsPays.length===0);
      if(!isEmpty) return;
      const [dbLoans, dbPays] = await Promise.all([idbGet(LS_KEYS.loans), idbGet(LS_KEYS.pays)]);
      const loans = Array.isArray(dbLoans) ? dbLoans : [];
      const pays = Array.isArray(dbPays) ? dbPays : [];
      if(loans.length || pays.length){
        writeLS(LS_KEYS.loans, loans);
        writeLS(LS_KEYS.pays, pays);
        try{ dbg('Restored data from IndexedDB'); }catch{}
      }
    }catch{}
  }

  /**
   * Compute derived fields for a loan (balance, next due, installments, etc.)
   * @param {Object} loan
   * @param {string} loan.id
   * @param {number} loan.principal
   * @param {string} loan.startDate
   * @param {number} loan.rateMonthlyPct
   * @param {number} loan.interestEveryMonths
   * @param {number} loan.interestPayoutMode
   * @param {string} [loan.repaymentDate]
   * @returns {{balance:number,nextDue:string,cycleInterest:number,expectedPayoutByMode:number,totalInstallments:number,remainingInstallments:number}}
   */
  function computeLoanDerived(loan){
    const toNum = (v)=>{
      try{
        const s = String(v ?? '');
        const ascii = (typeof normalizeDigits==='function') ? normalizeDigits(s) : s;
        const cleaned = ascii.replace(/[^0-9.\-]/g,'');
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : 0;
      }catch{ return Number(v)||0; }
    };
    const pays = state.pays.filter(p=> p.loanId === loan.id);
    const principalPaid = pays.filter(p=> p.type==='principal').reduce((a,p)=> a + toNum(p.amount), 0);
    const balance = Math.max(0, toNum(loan.principal) - principalPaid);

    // Next interest due based on payout mode (1/2/3 months or at maturity) and capped at maturity
    const mode = parseInt(String(loan.interestPayoutMode ?? 1),10); // 0: at maturity, 1: monthly, 2: bi-monthly, 3: quarterly
    // Normalize dates to ISO for reliable arithmetic (handles DD/MM/YYYY and Persian digits)
    const startISO = toISO(loan.startDate);
    const repayISO = toISO(loan.repaymentDate);
    const durationMonths = (parseInt(String(toNum(loan.interestEveryMonths)||0),10) || monthsDiff(startISO, repayISO) || 0);
    const maturityISO = repayISO || (durationMonths>0 && startISO ? addMonthsPersian(startISO, durationMonths) : '');
    const paidInstallments = pays.filter(p=> p.type==='interest').length;
    const totalInstallments = mode===0 ? 1 : (durationMonths>0 ? Math.ceil(durationMonths / (mode||1)) : 0);
    let nextDue = '';
    if(mode===0){
      nextDue = maturityISO || '';
    }else if(totalInstallments>0 && paidInstallments < totalInstallments){
      const targetMonthsFromStart = (mode || 1) * (paidInstallments + 1);
      nextDue = startISO ? addMonthsPersian(startISO, targetMonthsFromStart) : '';
      if(maturityISO && nextDue > maturityISO) nextDue = maturityISO;
    }

    // current cycle interest (for display): balance * monthlyRate * months in cycle (interestEveryMonths)
    const monthlyRate = toNum(loan.rateMonthlyPct)/100;
    const cycleInterest = Math.round(balance * monthlyRate * toNum(loan.interestEveryMonths));
    // expected payout by selected payout mode
    const k = mode===0 ? (parseInt(String(toNum(loan.interestEveryMonths)||0),10)||0) : mode; // 0 = at maturity -> use total months field available
    const expectedPayoutByMode = Math.round(balance * monthlyRate * (k||0));

    const remainingInstallments = Math.max(0, totalInstallments - paidInstallments);

    // Targeted debug for problematic card
    try{
      if(loan && loan.id === 'yjod0ut1d5dmeqy5pdr'){
        console.log('[DK][derive][yjod0ut1d5dmeqy5pdr]', {
          startISO, repayISO, durationMonths, maturityISO, mode, paidInstallments, totalInstallments,
          nextDue, remainingInstallments, balance, cycleInterest, expectedPayoutByMode
        });
      }
    }catch{}

    return { balance, nextDue, cycleInterest, expectedPayoutByMode, totalInstallments, remainingInstallments };
  }

  // UI-level filters and sorting (not persisted)
  const uiFilters = { creditor: '', status: '' /* '', 'overdue', 'awaiting', 'open', 'zero' */ };
  const uiSort = {
    loans: { key: '', dir: 'asc' },
    pays:  { key: '', dir: 'asc' }
  };
  // Expose filters for debugging in console
  try{ if(typeof window!=='undefined'){ window.uiFilters = uiFilters; } }catch{}

  // Unified Persian label for each status (use everywhere: cards, chips, summaries)
  function statusLabel(cat){
    switch(cat){
      case 'overdue': return 'دیرکرد';
      case 'awaiting': return 'در انتظار دریافت اصل پول';
      case 'zero': return 'اقساط تمام شد';
      default: return 'باز';
    }
  }
  // Expose for any late-bound callers
  try{ if(typeof window!=='undefined'){ window.statusLabel = statusLabel; } }catch{}

  // Debug helper: log current filters and category counts
  function logFilterState(where){
    try{
      const loans = Array.isArray(state?.loans) ? state.loans : [];
      const counts = { overdue:0, awaiting:0, open:0, zero:0 };
      loans.forEach(l=>{ try{ const d=computeLoanDerived(l)||{}; const c=categorizeLoan(l,d); if(counts[c]!=null) counts[c]++; }catch{} });
      console.debug('[DK][filters]', where||'', { uiFilters: { ...uiFilters }, counts });
    }catch{}
  }
  // Archive lock state (UI only) — controls ONLY the ops column, not visibility
  let archiveUnlocked = false;
  const ARCH_KEY_TS = 'dk_archive_unlocked_at';
  const ARCH_EXP_MS = 10*60*1000; // 10 minutes

  function applySort(array, key, dir, getVal){
    if(!key) return array;
    const sign = dir==='desc'? -1: 1;
    return array.slice().sort((a,b)=>{
      const va = getVal(a, key), vb = getVal(b, key);
      if(va==null && vb==null) return 0;
      if(va==null) return -1*sign; if(vb==null) return 1*sign;
      if(typeof va === 'number' && typeof vb === 'number') return (va - vb)*sign;
      return String(va).localeCompare(String(vb), 'fa', { numeric:true })*sign;
    });
  }

  function getVisibleLoansForTable(){
    const loansAll = state.loans || [];
    const filterCred = String(uiFilters.creditor||'').trim();
    let loans = filterCred
      ? loansAll.filter(l=> (String(l.creditor||'').trim() === filterCred))
      : loansAll.slice();
    // Map with derived once, to keep categorization consistent everywhere
    const withD = loans.map(l=>({ loan:l, d: computeLoanDerived(l)||{} }));
    if(uiFilters.status){
      // Detailed debug buckets for status-specific filters
      const _dbg = { inc: [], exc: [] };
      loans = withD.filter(row => {
        const k = uiFilters.status;
        if(k==='overdue'){
          // Overdue: only true overdue items (exclude awaiting)
          const d = row.d || {};
          const today = new Date().toISOString().slice(0,10);
          const rem = Number(d.remainingInstallments||0);
          const isOverdue = rem>0 && Number(d.balance||0)>0 && !!d.nextDue && String(d.nextDue) < today;
          if(window.DK_DEBUG){ (isOverdue? _dbg.inc : _dbg.exc).push({ id: row.loan.id, rem, balance: Number(d.balance||0), nextDue: d.nextDue||'', today, isOverdue, status: String(row.loan.status||'') }); }
          return isOverdue;
        }
        if(k==='awaiting'){
          const s = String(row.loan.status||'').toLowerCase();
          const rem = Number((row.d||{}).remainingInstallments||0);
          const ok = (s==='awaiting' && rem===0);
          if(window.DK_DEBUG){ (ok? _dbg.inc : _dbg.exc).push({ id: row.loan.id, rem, status: s }); }
          return ok;
        }
        return categorizeLoan(row.loan, row.d) === k;
      }).map(row=>row.loan);
      try{ if(window.DK_DEBUG){ console.debug('[DK][filter][status='+uiFilters.status+'] include', _dbg.inc); console.debug('[DK][filter][status='+uiFilters.status+'] exclude', _dbg.exc); } }catch{}
    }else{
      loans = withD.map(row=>row.loan);
    }
    // Exclude archived (closed) loans from main table
    const vis = loans.filter(l=> String(l.status||'') !== 'closed');
    try{ console.debug('[DK][visibleLoans][table]', { total: loansAll.length, afterCreditor: withD.length, final: vis.length, filter: { ...uiFilters } }); }catch{}
    return vis;
  }
  try{ if(typeof window!=='undefined'){ window.getVisibleLoansForTable = getVisibleLoansForTable; } }catch{}

  // Base visible loans (without status filter), used for summary counters
  function getVisibleLoansBase(){
    const loansAll = state.loans || [];
    const filterCred = String(uiFilters.creditor||'').trim();
    let loans = filterCred
      ? loansAll.filter(l=> (String(l.creditor||'').trim() === filterCred))
      : loansAll.slice();
    // Exclude archived (closed)
    loans = loans.filter(l=> String(l.status||'') !== 'closed');
    return loans.map(l=>({ loan:l, d: computeLoanDerived(l)||{} }));
  }

  // Unified categorization used by chips, filtering and table rows
  function categorizeLoan(loan, d){
    try{
      const today = new Date().toISOString().slice(0,10);
      const remInstNum = Number(d && d.remainingInstallments)||0;
      const balance = Number(d && d.balance)||0;
      const hasNextDue = !!(d && d.nextDue);
      const isOverdue = (remInstNum>0) && (balance>0) && hasNextDue && String(d.nextDue) < today;
      const s = String(loan.status||'').toLowerCase();
      // Business rules:
      // - If installments remain: overdue has priority else open
      // - If no installments remain: awaiting (explicit) overrides zero
      if(remInstNum > 0){
        return isOverdue ? 'overdue' : 'open';
      }else{
        if(s==='awaiting') return 'awaiting';
        return 'zero';
      }
    }catch{ return 'open'; }
  }

  function refreshLoansTable(){
    const tbody = $('#loansTable tbody');
    if(!tbody) return;
    const loansAll = state.loans;
    let loans = getVisibleLoansForTable();
    // apply sorting
    loans = applySort(loans, uiSort.loans.key, uiSort.loans.dir, (loan, key)=>{
      const d = computeLoanDerived(loan);
      switch(key){
        case 'creditor': return (loan.creditor||'');
        case 'borrower': return loan.borrower||'';
        case 'start': return loan.startDate||'';
        case 'principal': return Number(loan.principal||0);
        case 'rate': return Number(loan.rateMonthlyPct||0);
        case 'duration': return Number(loan.interestEveryMonths||0);
        case 'mode': return Number(loan.interestPayoutMode||0);
        case 'expected': return Number(d.expectedPayoutByMode||0);
        case 'balance': return Number(d.balance||0);
        case 'repay': return loan.repaymentDate||'';
        default: return '';
      }
    });
    // Show visible loans; closed ones go to archive table elsewhere
    tbody.innerHTML = loans.map(loan => {
      const d = computeLoanDerived(loan);
      const remInstNum = Number.isFinite(Number(d.remainingInstallments)) ? Number(d.remainingInstallments) : 0;
      const totInstNum = Number.isFinite(Number(d.totalInstallments)) ? Number(d.totalInstallments) : 0;
      const paidInstNum = Math.max(0, totInstNum - remInstNum);
      const pct = totInstNum>0 ? Math.round((paidInstNum/totInstNum)*100) : 0;
      const pctClass = pct>=66? 'high' : pct>=33? 'mid' : 'low';
      const repayIso = loan.repaymentDate ? toISO(loan.repaymentDate) : '';
      // categorization (single source of truth)
      const cat = categorizeLoan(loan, d);
      const today = new Date().toISOString().slice(0,10);
      const overdue = (d.balance>0) && d.nextDue && d.nextDue < today;
      const catFa = cat==='overdue' ? 'دیرکرد' : cat==='awaiting' ? 'در انتظار اصل پول' : cat==='zero' ? 'اقساط تمام شد' : 'باز';
      const modeVal = parseInt(String(loan.interestPayoutMode ?? 1),10); // 0: at maturity, 1: monthly, 2: bi-monthly, 3: quarterly
      const modeTxt = modeLabel(modeVal);
      const needResolve = (remInstNum===0);
      const canOps = isAdminUser() || (function(){ try{ return canModifyLoan(loan); }catch{ return false; } })();
      return `<tr data-id="${loan.id}" data-cat="${cat}" title="وضعیت: ${catFa}">
        <td>${loan.creditor || '—'}</td>
        <td>${loan.borrower}</td>
        <td>${bothDatesHTML(toISO(loan.startDate))}</td>
        <td>${fmtTom(loan.principal)} تومان</td>
        <td>${loan.rateMonthlyPct!=null && loan.rateMonthlyPct!=='' ? toFaDigits(String(loan.rateMonthlyPct)) + '٪' : '—'}</td>
        <td>
          ${loan.interestEveryMonths!=null && loan.interestEveryMonths!=='' ? toFaDigits(String(loan.interestEveryMonths)) + ' ماه' : '—'}
          <div class="small" style="margin-top:4px; opacity:.85; line-height:1.4">
            <div>اقساط&nbsp;مانده:</div>
            <div>${toFaDigits(String(remInstNum))}</div>
            ${(remInstNum>0 && overdue) ? (()=>{ try{ const [y1,m1,dd1]=String(d.nextDue).split('-').map(n=>parseInt(n,10)); const [y2,m2,dd2]=String(today).split('-').map(n=>parseInt(n,10)); let months=(y2-y1)*12+(m2-m1); if(dd2>=dd1) months+=1; months=Math.max(1, months|0); return `
              <div style="margin-top:6px"><span class="overdue-tag">${toFaDigits(String(months))} ماه دیرکرد</span></div>
              ${canOps ? `<div style=\"margin-top:6px\"><button class=\"btn small resolve\" data-act=\"loan-pay\" data-id=\"${loan.id}\"><span class=\"ico\">⏰</span><span>رسیدگی</span></button></div>` : ''}
            `; }catch{ return `
              <div style="margin-top:6px"><span class="overdue-tag">دیرکرد</span></div>
              ${canOps ? `<div style=\"margin-top:6px\"><button class=\"btn small resolve\" data-act=\"loan-pay\" data-id=\"${loan.id}\"><span class=\"ico\">⏰</span><span>رسیدگی</span></button></div>` : ''}
            `; } })() : ''}
            ${needResolve && loan.status!=='closed' ? `<div style="margin:4px 0"><span class="badge ${loan.status==='awaiting' ? 'awaiting' : 'done'}">${loan.status==='awaiting' ? 'در انتظار دریافت اصل پول' : 'اقساط تمام شد'}</span></div>` : ''}
            <div class=\"mini-progress remain\"><span style=\"width:${Math.max(0, Math.min(100, 100 - pct))}%\; background: var(--purple)\"></span></div>
            <div style="margin-top:6px">پرداخت‌شده:</div>
            <div>${toFaDigits(String(paidInstNum))}</div>
            ${needResolve && loan.status!=='closed' ? (canOps ? `<div style="margin-top:6px"><button class="btn small" data-act="resolve" data-id="${loan.id}">⏰ رسیدگی</button></div>` : '') : ''}
          </div>
          <div class="mini-progress"><span class="${pctClass}" style="width:${pct}%"></span></div>
        </td>
        <td>${modeTxt}</td>
        <td>${fmtTom(d.expectedPayoutByMode)} تومان</td>
        <td>${fmtTom(d.balance)} تومان</td>
        <td>
          ${bothDatesHTML(repayIso)}
        </td>
        <td>${loan.notes ? loan.notes : '—'}</td>
        <td>
          <div class="ops">
            ${canOps ? `
              <button class="btn small edit" data-act="edit" data-id="${loan.id}">✏️ ویرایش</button>
              <button class="btn small danger" data-act="del" data-id="${loan.id}">🗑️ حذف</button>
            ` : ''}
          </div>
        </td>
      </tr>`;
    }).join('');

    // update summary after loans table rebuild
    updateSummary();
    // also refresh archive table
    try{ refreshArchiveTable(); }catch{}
    // keep cards view in sync
    try{ refreshLoansCards(); }catch{}

    // rebuild loanSelect (with placeholder)
    const sel = $('#loanSelect');
    if(sel){
      const listForSelect = isLimitedUser() ? (loansAll.filter(l=> String(l.creditor||'').trim()==='سارا')) : loansAll;
      const opts = [`<option value="">— انتخاب قرض —</option>`]
        .concat(listForSelect.map(l=> {
          const cred = (l.creditor && String(l.creditor).trim()) || '—';
          const text = `${l.borrower} — ${fmtTom(l.principal)} تومان (${cred})`;
          return `<option value="${l.id}" title="${text}">${text}</option>`;
        }));
      sel.innerHTML = opts.join('');
    }
  }

  // Render payments table with built-in filters + creditor UI filter
  function refreshPaysTable(){
    const tbody = document.querySelector('#paymentsTable tbody');
    if(!tbody) return;
    const paysAll = state.pays || [];
    const borrowerQ = (document.querySelector('#payFilterBorrower')?.value || '').trim();
    const typeQ = document.querySelector('#payFilterType')?.value || 'all';
    const fromISO = document.querySelector('#payFilterFromAlt')?.value || '';
    const toISO = document.querySelector('#payFilterToAlt')?.value || '';
    const matchBorrower = (loan)=> borrowerQ ? String(loan.borrower||'').includes(borrowerQ) : true;
    const matchType = (p)=> typeQ==='all' ? true : (p.type===typeQ);
    const matchDate = (p)=> {
      const d = p.date;
      if(fromISO && d < fromISO) return false;
      if(toISO && d > toISO) return false;
      return true;
    };
    const matchCreditor = (loan)=> {
      const filterCred = String(uiFilters.creditor||'').trim();
      return filterCred ? (String(loan.creditor||'').trim() === filterCred) : true;
    };

    // build filtered list with deriveds for sorting
    let list = [];
    for(const p of paysAll){
      const loan = state.loans.find(l=> l.id===p.loanId);
      if(!loan) continue;
      if(!matchCreditor(loan)) continue;
      if(!matchBorrower(loan)) continue;
      if(!matchType(p)) continue;
      if(!matchDate(p)) continue;
      const d = computeLoanDerived(loan);
      list.push({ p, loan, d });
    }
    // apply sorting
    list = applySort(list, uiSort.pays.key, uiSort.pays.dir, (row, key)=>{
      switch(key){
        case 'borrower': return row.loan.borrower||'';
        case 'date': return row.p.date||'';
        case 'type': return row.p.type||'';
        case 'amount': return Number(row.p.amount||0);
        case 'remainInst': return Number(row.d.remainingInstallments||0);
        case 'balance': return Number(row.d.balance||0);
        default: return '';
      }
    });

    // Group by loan for a cleaner view (exclude closed loans in this card)
    const order = [];
    const groups = new Map(); // loanId -> { loan, d, items: [p] }
    for(const row of list){
      const loan = row.loan; if(!loan || loan.status==='closed') continue;
      if(!groups.has(loan.id)){ order.push(loan.id); groups.set(loan.id, { loan, d: row.d, items: [] }); }
      groups.get(loan.id).items.push(row.p);
    }

    const rows = [];
    for(const loanId of order){
      const { loan, d, items } = groups.get(loanId);
      const remNumRaw = Number(d && d.remainingInstallments);
      const remVal = Number.isFinite(remNumRaw) ? remNumRaw : 0;
      const remZero = remVal <= 0;
      const balanceTxt = fmtTom(d.balance) + ' تومان';
      const needResolveGrp = remZero && (loan.status!=='closed');
      const canOpsGrp = isAdminUser() || (function(){ try{ return canModifyLoan(loan); }catch{ return false; } })();
      const headerBadge = remZero
        ? `<span class="badge ${loan.status==='awaiting' ? 'awaiting' : 'done'}">${loan.status==='awaiting' ? 'در انتظار دریافت اصل پول' : 'اقساط تمام شد'}</span>`
        : `<span class="badge warn">${toFaDigits(String(remVal))} قسط مانده</span>`;
      const isOpen = false; // default collapsed
      // Group header row
      rows.push(`
        <tr class="pay-group" data-loan="${loan.id}"><td colspan="7">
          <div class="group-head">
            <button type="button" class="gh-toggle" aria-expanded="false" data-loan="${loan.id}">▸</button>
            <div class="gh-left">
              <div class="gh-borrower">${loan.borrower||'—'}</div>
              <div class="gh-cred small">${(loan.creditor && String(loan.creditor).trim()) || '—'}</div>
              <div class="badges-left">${statusLabel(cat)}</div>
            </div>
            <div class="gh-right small">مانده اصل: ${fmtTom(Number(loan.principal||0))} تومان — مانده فعلی: ${balanceTxt}</div>
          </div>
        </td></tr>
      `);
      // Child payment rows (compact, without repeating borrower/creditor)
      for(const p of items){
        const canOpsPay = isAdminUser() || (function(){ try{ return canModifyPayment(p); }catch{ return false; } })();
        rows.push(`
          <tr data-id="${p.id}" class="pay-child" data-loan="${loan.id}" style="display:${isOpen?'':'none'}">
            <td>—</td>
            <td>${bothDatesHTML(p.date)}</td>
            <td>${p.type==='interest'? 'سود':'اصل'}</td>
            <td>${fmtTom(p.amount)} تومان</td>
            <td>${toFaDigits(String(Math.max(0, remVal)))}</td>
            <td>${balanceTxt}</td>
            <td>
              <div class="ops">
                ${canOpsPay ? `
                  <button class=\"btn small edit\" data-act=\"p-edit\" data-id=\"${p.id}\">✏️ ویرایش</button>
                  <button class=\"btn small danger\" data-act=\"p-del\" data-id=\"${p.id}\">🗑️ حذف</button>
                ` : ''}
              </div>
            </td>
          </tr>
        `);
      }
    }
    tbody.innerHTML = rows.join('');

    try{ updateSummary(); }catch{}
    try{ refreshArchiveTable(); }catch{}
  }

  // Render archive table (closed loans only), with only a label and no actions
  function refreshArchiveTable(){
    const tbody = document.querySelector('#archiveTable tbody');
    if(!tbody) return;
    const closed = (state.loans||[]).filter(l=> l.status==='closed');
    const rows = closed.map(l=>{
      const startIso = l.startDate ? toISO(l.startDate) : '';
      const repayIso = l.repaymentDate ? toISO(l.repaymentDate) : '';
      const ops = archiveUnlocked
        ? `<div class="ops">
             <button class="btn small danger" data-act="arch-del" data-id="${l.id}">🗑️ حذف</button>
             <button class="btn small" data-act="arch-unarchive" data-id="${l.id}">📤 خارج از بایگانی</button>
           </div>`
        : '';
      return `
        <tr data-id="${l.id}">
          <td>${l.creditor || '—'}</td>
          <td>${l.borrower || '—'}</td>
          <td>${fmtTom(Number(l.principal||0))} تومان</td>
          <td>${bothDatesHTML(repayIso || startIso)}</td>
          <td><span class="stamp-arch">بایگانی شده</span></td>
          <td>${ops}</td>
        </tr>`;
    });
    tbody.innerHTML = rows.join('');
  }

  // Bind archive lock button and archive table actions (defined inside IIFE)
  function bindArchiveControls(){
    const lockBtn = document.querySelector('#archiveLockBtn');
    if(lockBtn && !lockBtn._bound){
      // On first bind, restore unlock state from session and set icon
      try{
        const ts = Number(sessionStorage.getItem(ARCH_KEY_TS)||'0');
        if(ts){
          const elapsed = Date.now() - ts;
          if(elapsed < ARCH_EXP_MS){ archiveUnlocked = true; } else { sessionStorage.removeItem(ARCH_KEY_TS); archiveUnlocked = false; }
        }
      }catch{}
      try{ lockBtn.textContent = archiveUnlocked ? '🔓' : '🔒'; }catch{}
      try{ refreshArchiveTable(); }catch{}
      lockBtn.addEventListener('click', async ()=>{
        try{
          if(archiveUnlocked){
            archiveUnlocked = false;
            try{ sessionStorage.removeItem(ARCH_KEY_TS); }catch{}
            lockBtn.textContent = '🔒';
            refreshArchiveTable();
            return;
          }
          const pass = await promptFaPassword('رمز عبور بایگانی را وارد کنید', { defaultValue: '' });
          if(String(pass) === '82161019'){
            archiveUnlocked = true;
            try{ sessionStorage.setItem(ARCH_KEY_TS, String(Date.now())); }catch{}
            lockBtn.textContent = '🔓';
            refreshArchiveTable();
          }else{
            await confirmFa('رمز نادرست است.', { okText:'باشه', cancelText:'انصراف' });
          }
        }catch{}
      });
      lockBtn._bound = true;
    }
    const archTable = document.querySelector('#archiveTable');
    if(archTable && !archTable._ops){
      archTable.addEventListener('click', async (ev)=>{
        const delBtn = ev.target.closest('button[data-act="arch-del"]');
        const unBtn  = ev.target.closest('button[data-act="arch-unarchive"]');
        if(delBtn){
          const id = delBtn.getAttribute('data-id'); if(!id) return;
          if(!archiveUnlocked) return;
          const ok = await (window.Delete?.ask ? window.Delete.ask('این قرض از بایگانی') : confirmFa('این قرض از بایگانی حذف شود؟'));
          if(!ok) return;
          state.loans = state.loans.filter(l=> l.id!==id);
          state.pays  = state.pays.filter(p=> p.loanId!==id);
          refreshLoansTable(); refreshPaysTable(); refreshArchiveTable(); try{ refreshLoansCards(); }catch{} updateSummary();
        }else if(unBtn){
          const id = unBtn.getAttribute('data-id'); if(!id) return;
          if(!archiveUnlocked) return;
          const ok = await confirmFa('این قرض از بایگانی خارج شود و دوباره فعال گردد؟');
          if(!ok) return;
          state.loans = state.loans.map(l=> l.id===id ? { ...l, status:'open' } : l);
          refreshLoansTable(); refreshPaysTable(); refreshArchiveTable(); try{ refreshLoansCards(); }catch{} updateSummary();
        }else{
          // Row click opens detail modal (ignore clicks on buttons)
          const tr = ev.target.closest('tr[data-id]');
          if(!tr) return;
          // avoid when clicking inside ops buttons area
          if(ev.target.closest('button')) return;
          const id = tr.getAttribute('data-id');
          const loan = (state.loans||[]).find(l=> l.id===id);
          if(!loan) return;
          const repayIso = loan.repaymentDate || '';
          const startIso = loan.startDate || '';
          const payoff = bothDatesHTML(repayIso ? toISO(repayIso) : (startIso? toISO(startIso):''));
          const principal = faFormatInt(Number(loan.principal||0)) + ' تومان';
          const rate = toFaDigits(String(Number(loan.rateMonthlyPct||0))) + '٪ در ماه';
          const duration = toFaDigits(String(Number(loan.interestEveryMonths||0))) + ' ماه';
          const modeMap = { 0:'در سررسید', 1:'ماهانه', 2:'دو ماه یکبار', 3:'سه ماه یکبار' };
          const mode = modeMap[Number(loan.interestPayoutMode||1)] || 'ماهانه';
          const notes = (loan.notes||'').trim().replace(/\n/g,'<br>') || '—';
          const body = `
            <div class="muted">بستانکار</div><div>${loan.creditor||'—'}</div>
            <div class="muted">گیرنده</div><div>${loan.borrower||'—'}</div>
            <div class="muted">تسویه نهایی</div><div>${payoff||'—'}</div>
            <div class="muted">اصل</div><div>${principal}</div>
            <div class="muted">سود ماهانه</div><div>${rate}</div>
            <div class="muted">مدت قرض</div><div>${duration}</div>
            <div class="muted">نحوه پرداخت سود</div><div>${mode}</div>
            <div class="muted">توضیحات</div><div>${notes}</div>
          `;
          await infoFa('جزئیات آیتم', body, { okText:'بستن' }, '<span class="stamp-arch stamp-left">بایگانی شده</span>');
        }
      });
      archTable._ops = true;
    }
  }

  // Make table headers clickable for sorting (loans and payments)
  function bindSorting(){
    // Loans table
    const lHead = document.querySelector('#loansTable thead');
    if(lHead && !lHead._sortable){
      const map = ['creditor','borrower','start','principal','rate','duration','mode','expected','balance','repay','notes','ops'];
      lHead.querySelectorAll('th').forEach((th, idx)=>{
        if(idx>=map.length-2) return; // skip notes/ops columns
        th.classList.add('sortable');
        if(!th.querySelector('.sort-ind')){ const s=document.createElement('span'); s.className='sort-ind'; th.appendChild(s); }
        th.addEventListener('click', ()=>{
          const key = map[idx];
          if(uiSort.loans.key===key){ uiSort.loans.dir = (uiSort.loans.dir==='asc')? 'desc':'asc'; }
          else{ uiSort.loans.key = key; uiSort.loans.dir = 'asc'; }
          lHead.querySelectorAll('th').forEach(h=> h.classList.remove('sort-asc','sort-desc'));
          th.classList.add(uiSort.loans.dir==='asc'?'sort-asc':'sort-desc');
          refreshLoansTable();
        });
      });
      lHead._sortable = true;
    }
    // Payments table
    const pHead = document.querySelector('#paymentsTable thead');
    if(pHead && !pHead._sortable){
      const map = ['borrower','date','type','amount','remainInst','balance','ops'];
      pHead.querySelectorAll('th').forEach((th, idx)=>{
        if(idx>=map.length-1) return; // skip ops
        th.classList.add('sortable');
        if(!th.querySelector('.sort-ind')){ const s=document.createElement('span'); s.className='sort-ind'; th.appendChild(s); }
        th.addEventListener('click', ()=>{
          const key = map[idx];
          if(uiSort.pays.key===key){ uiSort.pays.dir = (uiSort.pays.dir==='asc')? 'desc':'asc'; }
          else{ uiSort.pays.key = key; uiSort.pays.dir = 'asc'; }
          pHead.querySelectorAll('th').forEach(h=> h.classList.remove('sort-asc','sort-desc'));
          th.classList.add(uiSort.pays.dir==='asc'?'sort-asc':'sort-desc');
          refreshPaysTable();
        });
      });
      pHead._sortable = true;
    }
  }

  // Summary bar updater: total principal balance, remaining interest installments, active loans, and per-creditor chips
  function updateSummary(){
    // Visible loans should be identical to what the table displays
    let loans = getVisibleLoansForTable();
    let totalBalance = 0;
    let totalRemainInst = 0;
    let activeLoans = 0;
    const byCreditor = new Map();
    const countByCreditor = new Map();
    // grouped status counters
    let cntOverdue = 0, cntAwait = 0, cntOpen = 0, cntZero = 0;
    for(const loan of loans){
      // Exclude archived loans from all summary metrics
      if(String(loan.status||'') === 'closed') continue;
      const d = computeLoanDerived(loan) || {};
      let bal = Number(d.balance);
      if(!Number.isFinite(bal)){
        const paidPrincipal = (state.pays||[])
          .filter(p=> p.loanId===loan.id && p.type==='principal')
          .reduce((s,p)=> s + (Number(p.amount)||0), 0);
        bal = Math.max(0, Number(loan.principal||0) - paidPrincipal);
      }
      totalBalance += bal;
      let remInst = Number(d.remainingInstallments);
      if(!Number.isFinite(remInst)){
        try{
          const totalInst = Number(d.totalInstallments);
          if(Number.isFinite(totalInst)){
            const paidInst = (state.pays||[]).filter(p=> p.loanId===loan.id && p.type==='interest').length;
            remInst = Math.max(0, totalInst - paidInst);
          }else{ remInst = 0; }
        }catch{ remInst = 0; }
      }
      totalRemainInst += remInst;
      if(bal > 0) activeLoans += 1;
      // status grouping flags (count per-loan, not installments) — based on visible set
      try{
        const today = new Date().toISOString().slice(0,10);
        const overdue = (bal>0) && d.nextDue && d.nextDue < today;
        if(overdue) cntOverdue++;
        else if(String(loan.status||'')==='awaiting') cntAwait++;
        else if(remInst===0) cntZero++;
        else cntOpen++;
      }catch{}
      // group by creditor
      const cred = String(loan.creditor||'').trim() || '—';
      byCreditor.set(cred, (byCreditor.get(cred)||0) + bal);
      countByCreditor.set(cred, (countByCreditor.get(cred)||0) + 1);
    }
    const elBal = document.getElementById('sumTotalBalance');
    const elInst = document.getElementById('sumRemainInst');
    const elAct = document.getElementById('sumActiveLoans');
    if(elBal) elBal.textContent = loans.length? (fmtTom(totalBalance) + ' تومان') : '—';
    if(elInst) elInst.textContent = loans.length? toFaDigits(String(totalRemainInst)) : '—';
    if(elAct) elAct.textContent = loans.length? toFaDigits(String(activeLoans)) : '—';

    // Dynamically compose label for total balance with current selections
    try{
      const base = 'جمع مانده اصل';
      const parts = [];
      // Selected loan from payment form (if any)
      const loanSel = document.querySelector('#loanSelect');
      const loanIdSel = loanSel && loanSel.value;
      if(loanIdSel){
        const ln = (state.loans||[]).find(l=> l.id===loanIdSel);
        if(ln){
          const b = (ln.borrower||'').trim() || '—';
          parts.push(`قرض: ${b}`);
          const cred = (ln.creditor||'').trim();
          if(cred) parts.push(`بستانکار: ${cred}`);
        }
      }else{
        // If no specific loan selected, reflect creditor/status filter chips
        const credF = (uiFilters && uiFilters.creditor) ? String(uiFilters.creditor).trim() : '';
        if(credF) parts.push(`بستانکار: ${credF}`);
        const st = (uiFilters && uiFilters.status) || '';
        if(st){
          const map = { overdue:'دیرکرد', awaiting:'در انتظار دریافت اصل پول', open:'باز', zero:'اقساط تمام شد' };
          const stFa = map[st] || st;
          parts.push(`وضعیت: ${stFa}`);
        }
      }
      const labelEl = (function(){
        const bal = document.getElementById('sumTotalBalance');
        return bal && bal.previousElementSibling && bal.previousElementSibling.classList.contains('sum-label') ? bal.previousElementSibling : null;
      })();
      if(labelEl){ labelEl.textContent = parts.length ? `${base} — ${parts.join(' — ')}` : base; }
    }catch{}

    const elBy = document.getElementById('sumByCreditor');
    if(elBy){
      if(byCreditor.size === 0){ elBy.textContent = '—'; }
      else{
        const entries = Array.from(byCreditor.entries()).sort((a,b)=> b[1]-a[1]);
        const chips = [`<span class=\"sum-chip${uiFilters.creditor?'':' active'}\" data-cred=\"\" title=\"نمایش همه\" role=\"button\" tabindex=\"0\">همه</span>`]
          .concat(entries.map(([name, val])=>{
            const active = (uiFilters.creditor === name) ? ' active' : '';
            const cnt = countByCreditor.get(name) || 0;
            return `<span class=\"sum-chip${active}\" data-cred=\"${name}\" role=\"button\" tabindex=\"0\"><span class=\"badge\">${toFaDigits(String(cnt))}</span> <strong>${name}</strong> — ${fmtTom(val)} تومان</span>`;
          }));
        elBy.innerHTML = chips.join('');
        if(!elBy._bound){
          elBy.addEventListener('click', (ev)=>{
            const t = ev.target.closest('.sum-chip');
            if(!t) return;
            const cred = (t.getAttribute('data-cred') || '').trim();
            uiFilters.creditor = (String(uiFilters.creditor||'').trim() === cred) ? '' : cred;
            refreshLoansTable();
            refreshPaysTable();
            try{ if(typeof refreshLoansCards==='function') refreshLoansCards(); }catch{}
            updateSummary();
            // auto scroll to loans list
            const lo = document.querySelector('#loansTable');
            lo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          // keyboard accessibility: Enter/Space act like click
          elBy.addEventListener('keydown', (ev)=>{
            if(ev.key !== 'Enter' && ev.key !== ' ') return;
            const t = ev.target.closest('.sum-chip');
            if(!t) return;
            ev.preventDefault();
            const cred = t.getAttribute('data-cred') || '';
            uiFilters.creditor = (uiFilters.creditor === cred) ? '' : cred;
            refreshLoansTable();
            refreshPaysTable();
            try{ if(typeof refreshLoansCards==='function') refreshLoansCards(); }catch{}
            updateSummary();
            const lo = document.querySelector('#loansTable');
            lo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
          elBy._bound = true;
        }
      }
    }

    // Grouped status chips (order: overdue → awaiting → open → zeroInst)
    const elStatus = document.getElementById('sumByStatus');
    if(elStatus){
      // Recompute counters from the same base set used by cards/table (creditor-applied, exclude closed)
      let cntOverdue=0, cntAwaiting=0, cntOpen=0, cntZero=0;
      try{
        const base = getVisibleLoansBase();
        base.forEach(row=>{
          try{
            const cat = categorizeLoan(row.loan, row.d);
            if(cat==='overdue') cntOverdue++;
            else if(cat==='awaiting') cntAwaiting++;
            else if(cat==='zero') cntZero++;
            else cntOpen++;
          }catch{}
        });
        try{ if(window.DK_DEBUG){ console.debug('[DK][summary][counts]', { overdue:cntOverdue, awaiting:cntAwaiting, open:cntOpen, zero:cntZero, filter:{...uiFilters} }); } }catch{}
      }catch{}
      const mk = (key, baseLabel, count)=>{
        const active = uiFilters.status===key ? ' active' : '';
        const disabled = count<=0 ? ' disabled' : '';
        const attrs = disabled ? '' : ' role="button" tabindex="0"';
        const ico = key==='overdue' ? '⏰' : key==='awaiting' ? '⌛' : key==='open' ? '▶' : '🏁';
        const label = `${baseLabel} ${toFaDigits(String(count))} مورد`;
        return `<span class="sum-chip${active}${disabled}" data-status="${key}"${attrs}><span class="ico" aria-hidden="true">${ico}</span><span>${label}</span></span>`;
      };
      const allActive = uiFilters.status===''
        ? ' active' : '';
      const allChip = `<span class="sum-chip${allActive}" data-status="" role="button" tabindex="0"><span class="ico" aria-hidden="true">🔄</span><span>همه</span></span>`;
      const html = [
        allChip,
        mk('overdue', statusLabel('overdue'), cntOverdue),
        mk('awaiting', statusLabel('awaiting'), cntAwaiting),
        mk('open', statusLabel('open'), cntOpen),
        mk('zero', statusLabel('zero'), cntZero)
      ].join('');
      elStatus.innerHTML = html;
      if(!elStatus._bound){
        const handler = (ev)=>{
          const t = ev.target.closest('.sum-chip'); if(!t) return;
          if(t.classList.contains('disabled')) return;
          const k = t.getAttribute('data-status')||'';
          uiFilters.status = (uiFilters.status===k)? '' : k;
          refreshLoansTable(); refreshPaysTable(); try{ refreshLoansCards(); }catch{} updateSummary();
          // Sync active state to cards bar as well
          try{
            document.querySelectorAll('#cardsStatusBar .sum-chip').forEach(n=> n.classList.remove('active'));
            const tgt = document.querySelector(`#cardsStatusBar .sum-chip[data-status="${uiFilters.status}"]`) || document.querySelector('#cardsStatusBar .sum-chip[data-status=""]');
            tgt?.classList.add('active');
          }catch{}
          const lo = document.querySelector('#loansTable'); lo?.scrollIntoView({ behavior:'smooth', block:'start' });
        };
        elStatus.addEventListener('click', handler);
        elStatus.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' || ev.key===' '){ ev.preventDefault(); handler(ev); } });
        elStatus._bound = true;
      }
    }
  }

  function bindLoanForm(){
    const form = $(IDS.loanForm);
    if(!form) return;
    // Toggle: show form only when clicking the "ثبت قرض جدید" header
    try{
      const card = form.closest('section.card');
      const header = card?.querySelector('h2');
      let isOpen = false;
      const setOpen = (v)=>{
        isOpen = !!v;
        try{ form.style.display = isOpen ? '' : 'none'; }catch{}
        try{
          if(header){
            header.style.cursor = 'pointer';
            const txt = header.textContent || '';
            const base = txt.replace(/^([➕✖]\s*)?/, '');
            header.textContent = (isOpen ? '✖ ' : '➕ ') + base;
          }
        }catch{}
      };
      // hide by default
      setOpen(false);
      header?.addEventListener('click', ()=> setOpen(!isOpen));
      // expose open function for edit mode
      form._openLoanForm = ()=> setOpen(true);
    }catch{}
    // Disable native browser validation to use our own order/messages
    try{ form.setAttribute('novalidate',''); }catch{}
    // Helper: force-hide any open persian datepicker popovers
    const hideJalaliPicker = (inputEl)=>{
      try{ if(window.jQuery && inputEl) window.jQuery(inputEl).persianDatepicker('hide'); }catch{}
      const hideOnce = ()=>{ try{ document.querySelectorAll('.pdp-container, .persian-datepicker, .pwt-datepicker').forEach(n=> n.style.display='none'); }catch{} };
      hideOnce();
      // In case plugin immediately re-renders due to focus, hide again shortly after
      try{ setTimeout(hideOnce, 0); setTimeout(hideOnce, 100); setTimeout(hideOnce, 200); }catch{}
    };
    // Localize browser validation messages to Persian for this form
    (function localizeValidation(f){
      try{
        // on invalid, set a custom message
        f.addEventListener('invalid', (ev)=>{
          const el = ev.target;
          if(!el || !el.willValidate) return;
          // If a customError is already set (via showInvalid), do not override it
          try{ if(el.validity && el.validity.customError) return; }catch{}
          let msg = 'لطفاً این فیلد را پر کنید.';
          const tag = (el.tagName||'').toLowerCase();
          const type = (el.getAttribute('type')||'').toLowerCase();
          const name = (el.getAttribute('name')||'');
          const inputmode = (el.getAttribute('inputmode')||'').toLowerCase();
          if(tag==='select') msg = 'لطفاً یک گزینه را انتخاب کنید.';
          else if(type==='text' && (name==='startDate' || name==='repaymentDate' || el.id==='payDate')) msg = 'لطفاً تاریخ را وارد کنید.';
          else if(name==='principal') msg = 'لطفاً اصل مبلغ را وارد کنید';
          else if(type==='text' && (inputmode==='numeric' || inputmode==='decimal')) msg = 'لطفاً یک عدد معتبر وارد کنید.';
          else if(type==='number') msg = 'لطفاً یک عدد معتبر وارد کنید.';
          else if(name==='borrower') msg = 'لطفاً نام گیرنده را وارد کنید.';
          else if(name==='creditor') msg = 'لطفاً نام بستانکار را وارد کنید.';
          else if(name==='interestEveryMonths') msg = 'لطفاً مدت قرض را وارد کنید.';
          el.setCustomValidity(msg);
          try{ el.reportValidity(); }catch{}
          // If a date field became invalid, ensure the datepicker overlay is hidden
          if(name==='startDate' || name==='repaymentDate' || el.id==='startDate' || el.id==='repaymentDate'){
            hideJalaliPicker(el);
            // prevent auto-open on focus caused by validation bubble
            try{ el._suppressOpenUntilClick = true; }catch{}
            // fully destroy picker to avoid plugin re-show on focus; will reattach on next user mousedown
            try{ if(typeof el._dpDestroy === 'function') el._dpDestroy(); }catch{}
          }
        }, true);
        // clear custom message when user edits
        f.addEventListener('input', (ev)=>{ try{ ev.target.setCustomValidity(''); }catch{} }, true);
        f.addEventListener('change', (ev)=>{ try{ ev.target.setCustomValidity(''); }catch{} }, true);
      }catch{}
    })(form);
    let editingId = '';
    // Creditor preset wiring
    const creditorPreset = document.querySelector(IDS.creditorPreset);
    const creditorInput = document.querySelector(IDS.creditor);
    const creditorBackBtn = document.querySelector(IDS.creditorBackBtn);
    const JOINT_LABEL = 'سارا و رضا مشترک';
    const SARA_LABEL = 'سارا';
    const REZA_LABEL = 'رضا';
    const applyCreditorPresetUI = (opts={})=>{
      const keepManualValue = opts.keepManualValue === true;
      if(!creditorPreset || !creditorInput) return;
      const v = creditorPreset.value;
      const isManual = v === 'manual';
      // Toggle visibility so the manual input appears exactly in place of the select
      creditorPreset.style.display = isManual ? 'none' : '';
      creditorInput.style.display = isManual ? '' : 'none';
      if(creditorBackBtn) creditorBackBtn.style.display = isManual ? '' : 'none';
      // set value for known presets
      if(v==='joint') creditorInput.value = JOINT_LABEL;
      else if(v==='sara') creditorInput.value = SARA_LABEL;
      else if(v==='reza') creditorInput.value = REZA_LABEL;
      else if(v==='manual'){
        if(!keepManualValue) creditorInput.value = '';
        setTimeout(()=> creditorInput.focus(), 0);
      }
    };
    creditorPreset?.addEventListener('change', ()=> applyCreditorPresetUI({ keepManualValue: false }));
    creditorBackBtn?.addEventListener('click', ()=>{
      if(!creditorPreset) return;
      creditorPreset.value = 'joint';
      applyCreditorPresetUI();
    });
    // If user clears manual creditor input, automatically show the preset dropdown again
    if(creditorInput){
      const maybeResetToPreset = ()=>{
        const val = String(creditorInput.value||'').trim();
        if(val===''){
          if(creditorPreset){
            creditorPreset.value = 'joint';
            applyCreditorPresetUI({ keepManualValue: true });
          }
        }
      };
      creditorInput.addEventListener('input', maybeResetToPreset);
      creditorInput.addEventListener('blur', maybeResetToPreset);
    }
    // initialize UI for preset on load
    try{ applyCreditorPresetUI({ keepManualValue: true }); }catch{}
    // Role-based dropdown population: admin = full list, sister = only 'سارا'
    function rebuildCreditorOptionsForRole(){
      try{
        if(!creditorPreset) return;
        const current = creditorPreset.value || '';
        const clearAndAdd = (opts)=>{
          try{ creditorPreset.innerHTML = ''; }catch{}
          for(const o of opts){
            const el = document.createElement('option');
            el.value = o.v; el.textContent = o.t; creditorPreset.appendChild(el);
          }
        };
        if(isAdminUser()){
          // Full options for admin
          const full = [
            { v:'joint',  t:'سارا و رضا مشترک' },
            { v:'sara',   t:'سارا' },
            { v:'reza',   t:'رضا' },
            { v:'manual', t:'سایر/دستی' }
          ];
          clearAndAdd(full);
          // restore previous value if possible, else default to 'joint'
          const desired = full.some(o=>o.v===current) ? current : 'joint';
          creditorPreset.value = desired;
          try{ creditorPreset.removeAttribute('disabled'); }catch{}
          if(creditorInput){ try{ creditorInput.removeAttribute('readonly'); }catch{} }
        }else{
          // Sister: only 'سارا'
          const onlySara = [ { v:'sara', t:'سارا' } ];
          clearAndAdd(onlySara);
          creditorPreset.value = 'sara';
          try{ creditorPreset.removeAttribute('disabled'); }catch{}
          if(creditorInput){ try{ creditorInput.setAttribute('readonly',''); }catch{} }
        }
        // Sync the visible control and back button per mode
        applyCreditorPresetUI({ keepManualValue: false });
        if(creditorBackBtn){
          // Back button only makes sense when manual is available (admin)
          creditorBackBtn.style.display = isAdminUser() ? '' : 'none';
        }
      }catch{}
    }
    try{ rebuildCreditorOptionsForRole(); }catch{}
    // react to auth changes to re-apply role-specific UI
    try{ window.firebaseApi?.auth?.onAuthStateChanged?.(()=>{ rebuildCreditorOptionsForRole(); }); }catch{}
    // Live Persian digits and words for principal
    const principalInput = $(IDS.principalInput);
    const principalWords = $(IDS.principalWords);
    attachNumericFormatter(principalInput, principalWords);
    // Force a consistent custom message for principal when invalid
    if(principalInput && !principalInput._customInvalidBound){
      principalInput.addEventListener('invalid', (ev)=>{
        try{
          const el = ev.target;
          // If already has a custom message, keep it
          if(el.validity && el.validity.customError) return;
          el.setCustomValidity('لطفاً اصل مبلغ را وارد کنید');
        }catch{}
      });
      principalInput.addEventListener('input', (ev)=>{ try{ ev.target.setCustomValidity(''); }catch{} });
      principalInput._customInvalidBound = true;
    }
    // Ensure all other fields mirror digits to Persian as user types
    attachAutoFaDigitsWithin(form);

    // APR hint and monthly<->annual conversion
    const mEl = $(IDS.rateMonthlyPct);
    const aEl = $(IDS.rateAnnualPct);
    const aprHint = $(IDS.aprHint);
    const updAPR = ()=>{
      const m = parseFloat(normalizeDecimalAscii(mEl?.value || '0'))/100;
      if(aprHint){
        if(m>0){
          const eff = (Math.pow(1+m,12)-1)*100;
          const nom = (m*12)*100;
          // styled two-line hint with icons
          aprHint.innerHTML = `<span class="rate-line nominal"><span class="rate-icon">🅝</span>نرخ سالانه ساده ≈ ${toFaDigits(String(nom.toFixed(1)))}٪</span>`+
                              `<span class="rate-line effective"><span class="rate-icon">🅔</span>نرخ سالانه موثر ≈ ${toFaDigits(String(eff.toFixed(1)))}٪</span>`;
        }else{
          aprHint.innerHTML = `<span class="rate-line nominal"><span class="rate-icon">🅝</span>نرخ سالانه ساده ≈ —</span>`+
                              `<span class="rate-line effective"><span class="rate-icon">🅔</span>نرخ سالانه موثر ≈ —</span>`;
        }
      }
    };
    // keep inputs displayed as Persian digits with '.' and show inline percent sign on the LEFT side of the number
    attachDecimalFaDot(mEl, { appendPercent:true, percentPrefix:true });
    attachDecimalFaDot(aEl, { appendPercent:true, percentPrefix:true });
    // Guard against circular updates between monthly <-> annual fields
    let _syncingAPR = false;
    mEl?.addEventListener('input', ()=>{
      if(_syncingAPR) return;
      updAPR();
      // derive annual effective from monthly and reflect in annual field
      try{
        const m = parseFloat(normalizeDecimalAscii(mEl.value||'0'))/100;
        const eff = m>0 ? (Math.pow(1+m,12)-1)*100 : 0;
        // Avoid overwriting while user is typing in the annual field
        _syncingAPR = true;
        if(aEl && document.activeElement !== aEl){
          aEl.value = m>0 ? toFaDigits(String(eff.toFixed(2))) : '';
        }
        _syncingAPR = false;
      }catch{ _syncingAPR = false; }
    });
    aEl?.addEventListener('input', ()=>{
      if(_syncingAPR) return;
      const a = parseFloat(normalizeDecimalAscii(aEl.value||'0'))/100;
      if(a>0){
        const m = (Math.pow(1 + a, 1/12) - 1) * 100;
        const ascii = normalizeDecimalAscii(m.toFixed(2));
        _syncingAPR = true;
        mEl.value = toFaDigits(ascii);
        try{ mEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
        _syncingAPR = false;
      }else{
        // If annual effective is cleared or invalid, clear monthly field too
        _syncingAPR = true;
        if(mEl){ mEl.value = ''; try{ mEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{} }
        _syncingAPR = false;
      }
      updAPR();
    });

    // Expected interest payout per selected mode (monthly, bi-monthly, quarterly, at maturity)
    const payoutSel = document.querySelector(IDS.interestPayoutMode);
    const periodEl = document.querySelector(IDS.interestEveryMonths);
    const expLbl = document.querySelector(IDS.expectedInterestLabel);
    const expAmt = document.querySelector(IDS.expectedInterestAmount);
    const updateExpected = ()=>{
      // Principal: robustly parse FA/EN digits
      const prinAscii = normalizeDigitsToAscii(String(principalInput?.value||'')).replace(/[^0-9]/g,'');
      const principal = parseInt(prinAscii||'0',10) || 0;
      // Monthly rate (%): parse decimal safely from FA/EN
      const mRatePct = parseFloat(normalizeDecimalAscii(mEl?.value||''));
      const mRate = isFinite(mRatePct) ? (mRatePct/100) : 0;
      // Mode and duration
      const mode = parseInt(String(payoutSel?.value||'1'),10) || 1;
      const durAscii = normalizeDigitsToAscii(String(periodEl?.value||'')).replace(/[^0-9]/g,'');
      const durationMonths = parseInt(durAscii||'0',10) || 0;
      // For mode=0 (at maturity), if duration input is empty/incorrect, derive by dates
      let k = mode;
      if(mode===0){
        let kByDates = 0;
        try{
          const sISO = (document.querySelector(IDS.startDateAlt)?.value||'') || toISO(document.querySelector(IDS.startDate)?.value||'');
          const rISO = (document.querySelector(IDS.repaymentDateAlt)?.value||'') || toISO(document.querySelector(IDS.repaymentDate)?.value||'');
          if(sISO && rISO){
            const d1 = new Date(sISO); const d2 = new Date(rISO);
            const y1 = d1.getFullYear(), m1 = d1.getMonth()+1, dd1 = d1.getDate();
            const y2 = d2.getFullYear(), m2 = d2.getMonth()+1, dd2 = d2.getDate();
            let months = (y2 - y1)*12 + (m2 - m1);
            if(dd2 >= dd1) months += 1;
            kByDates = Math.max(1, months|0);
          }
        }catch{}
        k = Math.max(durationMonths||0, kByDates||0);
      }
      // 0 => at maturity = whole duration
      // label text
      const labelText = mode===1 ? 'سود قابل انتظار پرداختی ماهانه' : mode===2 ? 'سود قابل انتظار پرداختی دو ماهه' : mode===3 ? 'سود قابل انتظار پرداختی سه ماهه' : 'سود قابل انتظار پرداختی در سررسید';
      if(expLbl) expLbl.textContent = labelText;
      const value = Math.round(principal * mRate * (k||0));
      if(expAmt) expAmt.value = value? fmtTom(value) : '—';
    };

    // Persian digits for interestEveryMonths and auto-calc repayment default
    periodEl?.addEventListener('input', ()=>{
      const raw = normalizeDigits(periodEl.value).replace(/[^0-9]/g,'');
      const latin = raw.replace(/^0+(?!$)/,'');
      // allow empty field; do not force '1'
      periodEl.value = toFaDigits(latin);
      recomputeRepaymentFromUI();
      updateExpected();
      setTimeout(updateExpected, 0);
    });

    // Recompute expected payout on key inputs (debounced for smoother typing)
    const debouncedUE = debounce(updateExpected, 120);
    principalInput?.addEventListener('input', debouncedUE);
    mEl?.addEventListener('input', debouncedUE);
    payoutSel?.addEventListener('change', ()=>{ try{ updateExpected(); setTimeout(updateExpected, 0); setTimeout(updateExpected, 150); }catch{} });

    const submitBtn = document.querySelector(IDS.submitLoanBtn);
    const cancelBtn = document.querySelector(IDS.cancelEditLoan);
    const resetBtn  = (function(){ try{ return document.querySelector('#loanForm button[type="reset"]'); }catch{ return null; } })();
    const enterEditMode = (loan)=>{
      // Mark editing early to prevent any UI clear side-effects
      try{ window._dkEditingLoan = true; }catch{}
      try{ typeof form._openLoanForm==='function' && form._openLoanForm(); }catch{}
      // Add editing class before any toggles
      try{ form.classList.add('editing'); }catch{}
      editingId = loan.id;
      // Editing UI: change buttons visibility/text
      try{ if(submitBtn) submitBtn.textContent = 'ذخیره تغییرات'; }catch{}
      try{ if(cancelBtn){ cancelBtn.style.display = ''; cancelBtn.textContent = 'لغو ویرایش'; } }catch{}
      try{ if(resetBtn) resetBtn.style.display = 'none'; }catch{}
      // populate fields
      if(creditorPreset && creditorInput){
        if((loan.creditor||'') === JOINT_LABEL){
          creditorPreset.value = 'joint';
          creditorInput.value = JOINT_LABEL;
        }else if((loan.creditor||'') === SARA_LABEL){
          creditorPreset.value = 'sara';
          creditorInput.value = SARA_LABEL;
        }else if((loan.creditor||'') === REZA_LABEL){
          creditorPreset.value = 'reza';
          creditorInput.value = REZA_LABEL;
        }else{
          creditorPreset.value = 'manual';
          creditorInput.value = loan.creditor||'';
        }
        applyCreditorPresetUI({ keepManualValue: true });
        // Ensure joint UI reflects the loaded creditor immediately
        try{ toggleJointUI(); }catch{}
      }else{
        form.querySelector('[name="creditor"]').value = loan.creditor||'';
      }
      form.querySelector('[name="borrower"]').value = loan.borrower||'';
      // start date
      const iso = loan.startDate;
      const startAlt = document.querySelector(IDS.startDateAlt);
      const startInput = document.querySelector(IDS.startDate);
      if(startAlt) startAlt.value = iso||'';
      if(startInput) startInput.value = fmtFaYMD(iso||'');
      // show FA + EN hint under start date when editing
      const sHint = document.querySelector(IDS.startDateHint);
      if(sHint){
        const fa = fmtFaDate(iso||'');
        const en = fmtEnDate(iso||'');
        sHint.textContent = (fa && en) ? `${fa} — ${en}` : '';
      }
      // principal
      const pEl = document.querySelector(IDS.principalInput);
      if(pEl){
        pEl.value = faFormatInt(loan.principal||0);
        try{ console.debug('[DK][edit] set principal', loan.principal||0, '->', pEl.value); }catch{}
        try{ pEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
        try{ console.debug('[DK][edit] after dispatch principal now', pEl.value); }catch{}
        const w=document.querySelector(IDS.principalWords);
        if(w) w.textContent = loan.principal? (num2fa(loan.principal)+' تومان') : '';
      }
      // If joint loan and stored split exists, prefill split fields to avoid blanks
      try{
        const isJoint = /مشترک/.test(String(loan.creditor||''));
        if(isJoint){
          const sEl = document.querySelector(JOINT_IDS.principalSara);
          const rEl = document.querySelector(JOINT_IDS.principalReza);
          if(sEl && (loan.principalSara!=null)){
            sEl.value = faFormatInt(Number(loan.principalSara||0));
            try{ sEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
          }
          if(rEl && (loan.principalReza!=null)){
            rEl.value = faFormatInt(Number(loan.principalReza||0));
            try{ rEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
          }
        }
      }catch{}
      // rates
      const mField = document.querySelector(IDS.rateMonthlyPct);
      if(mField){ mField.value = toFaDigits(String(loan.rateMonthlyPct||0)); try{ mField.dispatchEvent(new Event('input', { bubbles:true })); }catch{} }
      // derive annual from monthly for edit view so it's not empty
      const aEl2 = document.querySelector(IDS.rateAnnualPct);
      try{
        const m = Number(loan.rateMonthlyPct||0)/100;
        const eff = m>0 ? (Math.pow(1+m,12)-1)*100 : 0;
        if(aEl2) aEl2.value = m>0 ? toFaDigits(String(eff.toFixed(2))) : '';
        // update APR hint text accordingly
        if(typeof updAPR === 'function') updAPR();
      }catch{ if(aEl2) aEl2.value = ''; }
      // period
      const per = document.querySelector(IDS.interestEveryMonths); if(per) per.value = loan.interestEveryMonths? toFaDigits(String(loan.interestEveryMonths)) : '';
      // payout mode
      if(payoutSel) payoutSel.value = String(loan.interestPayoutMode ?? '1');
      // repay
      const rAlt = document.querySelector(IDS.repaymentDateAlt); const rIn = document.querySelector(IDS.repaymentDate);
      if(rAlt) rAlt.value = loan.repaymentDate || '';
      if(rIn) rIn.value = fmtFaYMD(loan.repaymentDate||'');
      const rHint = document.querySelector(IDS.repaymentDateHint); if(rHint){ const fa=fmtFaDate(loan.repaymentDate||''), en=fmtEnDate(loan.repaymentDate||''); rHint.textContent = (fa&&en)? `${fa} — ${en}`: ''; }
      // ensure expected interest is shown immediately in edit mode
      try{ if(typeof updateExpected === 'function') updateExpected(); }catch{}
      try{ window._dkEditingLoan = false; }catch{}
      // Defensive: late-bound listeners may still clear fields; force re-fill a few times
      const refiller = ()=>{
        try{
          const pEl2 = document.querySelector(IDS.principalInput);
          try{ console.debug('[DK][refill:start]', 'main value:', pEl2?.value||''); }catch{}
          if(pEl2){
            const asciiDigits = normalizeDigitsToAscii(String(pEl2.value||'')).replace(/[^0-9]/g,'');
            const shouldRefill = asciiDigits.length===0 || asciiDigits==='0';
            if(shouldRefill){
              pEl2.value = faFormatInt(loan.principal||0);
              try{ console.debug('[DK][refill:set main]', pEl2.value); }catch{}
              try{ pEl2.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
            }
          }
          // Ensure joint split values remain present in edit mode
          try{
            const isJoint = /مشترک/.test(String(loan.creditor||''));
            if(isJoint){
              const sEl = document.querySelector(JOINT_IDS.principalSara);
              const rEl = document.querySelector(JOINT_IDS.principalReza);
              if(sEl){
                const sDigits = normalizeDigitsToAscii(String(sEl.value||'')).replace(/[^0-9]/g,'');
                if((sDigits.length===0 || sDigits==='0') && (loan.principalSara!=null)){
                  sEl.value = faFormatInt(Number(loan.principalSara||0));
                  try{ console.debug('[DK][refill:set sara]', sEl.value); }catch{}
                  try{ sEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
                }
              }
              if(rEl){
                const rDigits = normalizeDigitsToAscii(String(rEl.value||'')).replace(/[^0-9]/g,'');
                if((rDigits.length===0 || rDigits==='0') && (loan.principalReza!=null)){
                  rEl.value = faFormatInt(Number(loan.principalReza||0));
                  try{ console.debug('[DK][refill:set reza]', rEl.value); }catch{}
                  try{ rEl.dispatchEvent(new Event('input', { bubbles:true })); }catch{}
                }
              }
            }
          }catch{}
          // Recompute expected (total + shares)
          try{ console.debug('[DK][refill:recompute]'); }catch{}
          updateJointComputed();
          if(typeof updateExpected === 'function') updateExpected();
          try{ console.debug('[DK][refill:end]', 'main now:', document.querySelector(IDS.principalInput)?.value||''); }catch{}
        }catch{}
      };
      try{
        setTimeout(refiller, 0);
        setTimeout(refiller, 150);
        setTimeout(refiller, 350);
        setTimeout(refiller, 1200);
        setTimeout(refiller, 2000);
        setTimeout(refiller, 3000);
      }catch{}
    };
    try{ window.enterEditMode = enterEditMode; }catch{}

    cancelBtn?.addEventListener('click', ()=>{
      editingId = '';
      form.reset();
      try{ window._dkEditingLoan = false; }catch{}
      if(submitBtn) submitBtn.textContent = 'ثبت قرض';
      cancelBtn.style.display = 'none';
      try{ if(resetBtn) resetBtn.style.display = ''; }catch{}
      form.classList.remove('editing');
      const w=document.querySelector('#principalWords'); if(w) w.textContent='';
      const rHint = document.querySelector('#repaymentDateHint'); if(rHint) rHint.textContent='';
    });

    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      // Prefer hidden ISO values from Jalali datepicker if available (robust to missing name attr)
      const q = (sel)=> document.querySelector(sel);
      const getFD = (name, sel)=>{
        let v = String(fd.get(name)||'');
        if(!v && sel){ const el = q(sel); if(el) v = String(el.value||''); }
        return v;
      };
      const startISO = getFD('startDateAlt', '#startDateAlt') || toISO(getFD('startDate', '#startDate'));
      const repayISO = getFD('repaymentDateAlt', '#repaymentDateAlt') || (getFD('repaymentDate', '#repaymentDate') ? toISO(getFD('repaymentDate', '#repaymentDate')) : '');
      const borrowerVal = String(fd.get('borrower')||'').trim();
      if(!borrowerVal){
        const inp = form.querySelector('[name="borrower"]');
        if(inp){ inp.setCustomValidity('لطفاً نام گیرنده را وارد کنید.'); try{ inp.reportValidity(); inp.focus(); }catch{} }
        return;
      }
      let creditorVal = String(fd.get('creditor')||'').trim();
      if(creditorPreset){
        const v = creditorPreset.value;
        if(v==='joint') creditorVal = JOINT_LABEL;
        else if(v==='sara') creditorVal = SARA_LABEL;
        else if(v==='reza') creditorVal = REZA_LABEL;
        else creditorVal = creditorVal; // manual
      }
      // Enforce role: limited users may only create 'سارا' loans
      if(isLimitedUser()){
        creditorVal = SARA_LABEL;
      }

      // Validations (user-friendly)
      // 1) Date validations first so user sees missing date before amount errors
      if(!isValidISO(startISO)){
        const sd = document.querySelector(IDS.startDate);
        if(sd){
          try{ sd.setCustomValidity('لطفاً تاریخ شروع را از تقویم انتخاب کنید.'); sd.reportValidity(); sd.focus(); }catch{}
        }
        return;
      }
      // 2) Amount validations
      const principalVal = parseNum(fd.get('principal'));
      if(!(principalVal>0)){
        const el = document.querySelector(IDS.principalInput);
        showInvalid(el, 'لطفاً اصل مبلغ را وارد کنید');
        return;
      }
      const mRaw = normalizeDecimalAscii(fd.get('rateMonthlyPct'));
      if(mRaw===''){
        const el = document.querySelector(IDS.rateMonthlyPct);
        showInvalid(el, 'لطفاً سود ماهانه را وارد کنید.');
        return;
      }
      const mRateVal = parseFloat(mRaw);
      if(mRateVal<0){
        const el = document.querySelector(IDS.rateMonthlyPct);
        showInvalid(el, 'سود ماهانه نمی‌تواند منفی باشد.');
        return;
      }
      const periodMonthsRaw = String(fd.get('interestEveryMonths')||'').trim();
      const periodMonths = parseInt(String(parseNum(periodMonthsRaw||'0')||'0'),10) || 0;
      if(!(periodMonths>0)){
        const pmEl = form.querySelector('[name="interestEveryMonths"]') || document.querySelector(IDS.interestEveryMonths);
        showInvalid(pmEl, 'لطفاً مدت قرض را وارد کنید.');
        return;
      }
      const payoutSelVal = (document.querySelector(IDS.interestPayoutMode)?.value || '').trim();
      if(payoutSelVal===''){
        const el = document.querySelector(IDS.interestPayoutMode);
        showInvalid(el, 'لطفاً نحوه پرداخت سود را انتخاب کنید.');
        return;
      }
      // 2.5) Validate payout interval vs loan duration
      try{
        const payoutInt = parseInt(payoutSelVal, 10);
        // Mode 0 = at maturity (whole duration) is always valid; for 1/2/3 ensure <= duration months
        if(payoutInt !== 0 && payoutInt > periodMonths){
          const el = document.querySelector(IDS.interestPayoutMode);
          showInvalid(el, 'نحوه پرداخت سود باید کوچکتر یا حداکثر برابر با مدت قرض باشد.');
          return;
        }
      }catch{}
      // 3) Remaining date validations
      if(repayISO && !isValidISO(repayISO)){
        const el = document.querySelector(IDS.repaymentDate);
        showInvalid(el, 'تاریخ تسویه معتبر نیست.');
        return;
      }
      if(repayISO && isValidISO(startISO) && compareISO(repayISO, startISO) < 0){
        const el = document.querySelector(IDS.repaymentDate);
        showInvalid(el, 'تاریخ تسویه نمی‌تواند قبل از تاریخ شروع باشد.');
        return;
      }

      const uNow = getCurrentUser();
      // capture joint split if applicable
      let principalSara = 0, principalReza = 0;
      try{
        const isJoint = /مشترک/.test(String(creditorVal||''));
        if(isJoint){
          const sEl = document.querySelector(JOINT_IDS.principalSara);
          const rEl = document.querySelector(JOINT_IDS.principalReza);
          principalSara = parseNum(sEl && sEl.value || '0');
          principalReza = parseNum(rEl && rEl.value || '0');
        }
      }catch{}
      const loan = {
        id: uid(),
        creditor: creditorVal,
        borrower: String(fd.get('borrower')||'').trim(),
        startDate: startISO,
        principal: principalVal,
        rateMonthlyPct: mRateVal,
        interestEveryMonths: periodMonths,
        interestPayoutMode: parseInt(String(fd.get('interestPayoutMode')||'1'),10),
        repaymentDate: repayISO || '',
        notes: String(fd.get('notes')||'').trim(),
        principalSara,
        principalReza,
        createdAt: new Date().toISOString(),
        createdByUid: uNow && uNow.uid || '',
        createdByEmail: uNow && uNow.email || ''
      };
      let createdId = '';
      const editedIdLocal = editingId;
      if(editingId){
        const loans = state.loans.map(l=> l.id===editingId ? { ...l, ...loan, id: editingId } : l);
        state.loans = loans;
        editingId = '';
      }else{
        const loans = state.loans; loans.push(loan); state.loans = loans;
        createdId = loan.id;
      }
      form.reset();
      aprHint && (aprHint.textContent = 'نرخ سالانه موثر ≈ —');
      principalWords && (principalWords.textContent = '');
      if(periodEl) periodEl.value = '';
      if(submitBtn) submitBtn.textContent = 'ثبت قرض';
      if(cancelBtn) cancelBtn.style.display = 'none';
      try{ if(resetBtn) resetBtn.style.display = ''; }catch{}
      form.classList.remove('editing');
      refreshLoansTable();
      refreshPaysTable();
      try{ refreshLoansCards && refreshLoansCards(); }catch{}
      try{ updateSummary(); }catch{}
      // Scroll to affected row and highlight (new or edited)
      const targetId = createdId || editedIdLocal;
      if(targetId){
        const row = document.querySelector(`#loansTable tbody tr[data-id="${targetId}"]`);
        if(row){
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('flash-success');
          setTimeout(()=> row.classList.remove('flash-success'), 2000);
        }
        // Also try to highlight the card if visible in cards grid
        try{
          const card = document.querySelector(`.loan-card[data-id="${targetId}"]`);
          if(card){
            card.scrollIntoView({ behavior:'smooth', block:'nearest' });
            const prev = card.style.boxShadow;
            card.style.boxShadow = '0 0 0 2px var(--purple) inset';
            setTimeout(()=>{ try{ card.style.boxShadow = prev || ''; }catch{} }, 1800);
          }
        }catch{}
      }
    });

    // Row operations for loans table
    $(IDS.loansTable)?.addEventListener('click', async (ev)=>{
      const btn = ev.target.closest('button[data-act="del"]');
      const editBtn = ev.target.closest('button[data-act="edit"]');
      const resolveBtn = ev.target.closest('button[data-act="resolve"]');
      const payBtn = ev.target.closest('button[data-act="loan-pay"]');
      if(resolveBtn){
        const id = resolveBtn.getAttribute('data-id'); if(!id) return;
        const loan = state.loans.find(l=> l.id===id);
        if(!loan || (!canModifyLoan(loan) && !isAdminUser())) return;
        try{ await resolveZeroInstallments(id); }catch{}
        return;
      }
      if(payBtn){
        const id = payBtn.getAttribute('data-id'); if(!id) return;
        const loan = state.loans.find(l=> l.id===id);
        if(!loan) return;
        if(isLimitedUser() && String(loan.creditor||'').trim()!=='سارا' && !canModifyLoan(loan)) return;
        openPaymentFormForLoan(id);
        return;
      }
      if(btn){
        const id = btn.getAttribute('data-id');
        if(!id) return;
        const loan = state.loans.find(l=> l.id===id);
        if(!loan || (!canModifyLoan(loan) && !isAdminUser())) return;
        const ok = await (window.Delete?.ask ? window.Delete.ask('این قرض') : confirmFa('این قرض حذف شود؟'));
        if(!ok) return;
        state.loans = state.loans.filter(l=> l.id!==id);
        state.pays = state.pays.filter(p=> p.loanId!==id);
        refreshLoansTable();
        refreshPaysTable();
        return;
      }
      if(editBtn){
        const id = editBtn.getAttribute('data-id');
        if(!id) return;
        const loan = state.loans.find(l=> l.id===id);
        if(loan){
          if(!canModifyLoan(loan) && !isAdminUser()) return;
          const isClosed = (loan.status === 'closed');
          const msg = isClosed
            ? 'این قرض کامل بازپرداخت شده است، آیا از ویرایش این قرض مطمئن هستید؟'
            : 'آیا از ویرایش این قرض مطمئن هستید؟';
          const ok = await confirmFa(msg);
          if(!ok) return;
          enterEditMode(loan);
          // scroll to loan form and focus first field
          const lf = document.querySelector(IDS.loanForm);
          lf?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(()=>{ lf?.querySelector('[name="creditor"]')?.focus(); }, 250);
        }
      }
    });

    // Ensure loan form is cleared on page load/refresh
    try{
      const lf = document.getElementById('loanForm');
      lf?.reset();
      // reset form to pristine state on load
      // reset creditor preset UI to default (joint)
      if(creditorPreset){ creditorPreset.value = 'joint'; }
      applyCreditorPresetUI();
      const clearVal = (sel)=>{ const el = document.querySelector(sel); if(el) el.value=''; };
      clearVal(IDS.startDate); clearVal(IDS.startDateAlt);
      clearVal(IDS.repaymentDate); clearVal(IDS.repaymentDateAlt);
      clearVal(IDS.principalInput);
      clearVal(IDS.rateAnnualPct);
      clearVal(IDS.interestEveryMonths);
      const ps = document.querySelector(IDS.interestPayoutMode); if(ps) ps.value='1';
      const exp = document.querySelector(IDS.expectedInterestAmount); if(exp) exp.value='—';
      const exl = document.querySelector(IDS.expectedInterestLabel); if(exl) exl.textContent='سود قابل انتظار پرداختی ماهانه';
      const pw = document.querySelector(IDS.principalWords); if(pw) pw.textContent='';
      const sh = document.querySelector(IDS.startDateHint); if(sh){ sh.textContent=''; try{ if(sh.dataset) delete sh.dataset.frozen; }catch{} }
      const rh = document.querySelector(IDS.repaymentDateHint); if(rh) rh.textContent='';
      const ah = document.querySelector(IDS.aprHint); if(ah) ah.textContent='نرخ سالانه موثر ≈ —';
      // initial compute
      updateExpected();
    }catch{}
  }

  // Update activity banner at start and when tab visibility changes
  try{ document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') touchLastSeen(); }); }catch{}

  // (legacy duplicate banner block removed; using meta-based banner functions above)

  function bindPaymentForm(){
    const form = $(IDS.paymentForm);
    if(!form) return;
    // Disable native browser validation to enforce our RTL order
    try{ form.setAttribute('novalidate',''); }catch{}
    const hideJalaliPicker = (inputEl)=>{
      try{ if(window.jQuery && inputEl) window.jQuery(inputEl).persianDatepicker('hide'); }catch{}
      try{ document.querySelectorAll('.pdp-container, .persian-datepicker, .pwt-datepicker').forEach(n=> n.style.display='none'); }catch{}
    };
    // Localize validation messages to Persian for payment form
    (function localizeValidation(f){
      try{
        f.addEventListener('invalid', (ev)=>{
          const el = ev.target; if(!el || !el.willValidate) return;
          const tag = (el.tagName||'').toLowerCase();
          const name = (el.getAttribute('name')||'');
          let msg = 'لطفاً این فیلد را پر کنید.';
          if(tag==='select') msg = (name==='type') ? 'لطفاً نوع پرداخت را انتخاب نمایید.' : 'لطفاً یک گزینه را انتخاب کنید.';
          else if(name==='date') msg = 'لطفاً تاریخ پرداخت را وارد کنید.';
          else if(name==='amount') msg = 'لطفاً مبلغ را وارد کنید.';
          el.setCustomValidity(msg);
          if(name==='date' || el.id==='payDate'){
            hideJalaliPicker(el);
            try{ el._suppressOpenUntilClick = true; }catch{}
            try{ if(typeof el._dpDestroy === 'function') el._dpDestroy(); }catch{}
          }
        }, true);
        f.addEventListener('input', (ev)=>{ try{ ev.target.setCustomValidity(''); }catch{} }, true);
        f.addEventListener('change', (ev)=>{ try{ ev.target.setCustomValidity(''); }catch{} }, true);
      }catch{}
    })(form);
    // Live Persian digits and words for payment amount
    const amtEl = $(IDS.payAmountInput);
    const amtWords = $(IDS.payAmountWords);
    let editingPayId = '';
    // Auto-fill amount when type is interest and loan changes
    const autoFillInterestAmount = ()=>{
      try{
        const typeSel = form.querySelector('[name="type"]');
        const loanSel = document.querySelector(IDS.loanSelect);
        if(!typeSel || !loanSel || !amtEl) return;
        const isInterest = String(typeSel.value||'interest') === 'interest';
        if(!isInterest) return; // only for سود
        const loanId = String(loanSel.value||'');
        const loan = state.loans.find(l=> l.id===loanId);
        if(!loan) return;
        const d = computeLoanDerived(loan);
        // Use expected payout based on payout mode (matches the loans table column)
        const val = Math.max(0, Math.round(d.expectedPayoutByMode||0));
        if(val>0){
          amtEl.value = faFormatInt(val);
          if(amtWords) amtWords.textContent = num2fa(val) + ' تومان';
        }else{
          // keep empty to let user decide when zero
          amtEl.value = '';
          if(amtWords) amtWords.textContent = '';
        }
      }catch{}
    };

    // Disallow manual typing for any date input selector
    function preventManualTypingOn(sel){
      try{
        const el = document.querySelector(sel);
        if(!el) return;
        const block = (e)=>{ e.preventDefault(); };
        el.addEventListener('beforeinput', block);
        el.addEventListener('keypress', block);
        el.addEventListener('paste', block);
        el.addEventListener('drop', block);
        el.addEventListener('keydown', (e)=>{
          const allowed = ['Tab','Shift','ArrowLeft','ArrowRight','Home','End'];
          if(!allowed.includes(e.key)){
            if(!(e.key && e.key.length>1)) return;
            e.preventDefault();
          }
        });
        el.setAttribute('autocomplete','off');
        el.setAttribute('inputmode','none');
      }catch{}
    }
    // Disallow manual typing for any date input selector
    function preventManualTypingOn(sel){
      try{
        const el = document.querySelector(sel);
        if(!el) return;
        const block = (e)=>{ e.preventDefault(); };
        el.addEventListener('beforeinput', block);
        el.addEventListener('keypress', block);
        el.addEventListener('paste', block);
        el.addEventListener('drop', block);
        el.addEventListener('keydown', (e)=>{
          const allowed = ['Tab','Shift','ArrowLeft','ArrowRight','Home','End'];
          if(!allowed.includes(e.key)){
            if(!(e.key && e.key.length>1)) return;
            e.preventDefault();
          }
        });
        el.setAttribute('autocomplete','off');
        el.setAttribute('inputmode','none');
      }catch{}
    }
    attachNumericFormatter(amtEl, amtWords);
    const submitBtn = document.querySelector(IDS.submitPayBtn);
    const cancelBtn = document.querySelector(IDS.cancelPayEdit);
    // Block manual typing on payDate similar to startDate
    try{ preventManualTypingOn('#payDate'); }catch{}
    // Wire auto-fill/clear for type and loan selection changes
    const typeSelEl = form.querySelector('[name="type"]');
    typeSelEl?.addEventListener('change', ()=>{
      const t = String(typeSelEl.value||'');
      if(t === 'interest'){
        autoFillInterestAmount();
      }else{ // placeholder or principal
        if(amtEl) amtEl.value = '';
        if(amtWords) amtWords.textContent = '';
      }
    });
    const onLoanSelectChange = ()=>{
      const t = String((typeSelEl && typeSelEl.value) || '');
      if(t === 'interest'){
        autoFillInterestAmount();
      }else{
        if(amtEl) amtEl.value = '';
        if(amtWords) amtWords.textContent = '';
      }
    };
    document.querySelector(IDS.loanSelect)?.addEventListener('change', onLoanSelectChange);
    const enterPayEdit = async (pay)=>{
      editingPayId = pay.id;
      // loan select
      const sel = document.querySelector(IDS.loanSelect);
      if(sel) sel.value = pay.loanId;
      // date
      const alt = document.querySelector(IDS.payDateAlt);
      const inp = document.querySelector(IDS.payDate);
      if(alt) alt.value = pay.date;
      if(inp) inp.value = fmtFaYMD(pay.date);
      const hint = document.querySelector(IDS.payDateHint);
      if(hint){ const fa = fmtFaDate(pay.date), en = fmtEnDate(pay.date); hint.textContent = fa && en ? `${fa} — ${en}` : ''; }
      // type
      const typeSel = form.querySelector('[name="type"]');
      if(typeSel) typeSel.value = pay.type;
      // amount
      if(amtEl) amtEl.value = faFormatInt(pay.amount||0);
      if(amtWords) amtWords.textContent = pay.amount? (num2fa(pay.amount)+' تومان') : '';
      if(submitBtn) submitBtn.textContent = 'ذخیره ویرایش پرداخت';
      if(cancelBtn) cancelBtn.style.display = '';
      // scroll to payment form and focus first field
      const pf = document.querySelector(IDS.paymentForm);
      pf?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(()=>{ document.querySelector(IDS.loanSelect)?.focus(); }, 250);
      pf?.classList.add('editing');
      // also open the datepicker once user focuses the date field
      setTimeout(()=>{ try{ window.jQuery && window.jQuery('#payDate').trigger('focus'); }catch{} }, 350);
    };

    cancelBtn?.addEventListener('click', ()=>{
      editingPayId = '';
      form.reset();
      if(amtWords) amtWords.textContent='';
      const hint = document.querySelector(IDS.payDateHint); if(hint){ hint.textContent=''; try{ if(hint.dataset) delete hint.dataset.frozen; }catch{} }
      try{ const alt=document.querySelector(IDS.payDateAlt); if(alt) alt.value=''; }catch{}
      if(submitBtn) submitBtn.textContent = 'ثبت پرداخت';
      cancelBtn.style.display = 'none';
      form.classList.remove('editing');
    });

    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      // Clear any previous custom errors to avoid bubbling the wrong field
      try{
        document.querySelector(IDS.loanSelect)?.setCustomValidity('');
        document.querySelector(IDS.payDate)?.setCustomValidity('');
        form.querySelector('[name="type"]')?.setCustomValidity('');
        document.querySelector(IDS.payAmountInput)?.setCustomValidity('');
      }catch{}
      // Read values directly from DOM to avoid stale FormData edge-cases
      const loanSelEl = document.querySelector(IDS.loanSelect);
      const payDateAltEl = document.querySelector(IDS.payDateAlt);
      const payDateEl = document.querySelector(IDS.payDate);
      const typeSelEl2 = form.querySelector('[name="type"]');
      const amountEl = document.querySelector(IDS.payAmountInput);
      const loanId = String(loanSelEl && loanSelEl.value || '');
      let payISO = '';
      try{ payISO = String(payDateAltEl && payDateAltEl.value || ''); }catch{}
      if(!payISO){
        try{ const raw = String(payDateEl && payDateEl.value || ''); payISO = toISO(raw); }catch{}
      }
      const rawType = String(typeSelEl2 && typeSelEl2.value || '');
      // 1) Loan selection first
      if(!loanId){
        const el = document.querySelector(IDS.loanSelect);
        showInvalid(el, 'لطفاً یک قرض انتخاب کنید.');
        return;
      }
      // 2) Date second
      if(!isValidISO(payISO)){
        const el = document.querySelector(IDS.payDate);
        showInvalid(el, 'لطفاً تاریخ پرداخت را از تقویم انتخاب کنید.');
        return;
      }
      // 3) Type third
      if(!(rawType==='interest' || rawType==='principal')){
        const el = form.querySelector('[name="type"]');
        showInvalid(el, 'لطفاً نوع پرداخت را انتخاب نمایید.');
        return;
      }
      const uNow2 = getCurrentUser();
      const pay = {
        id: uid(),
        loanId,
        date: payISO,
        type: rawType,
        amount: parseNum(amountEl && amountEl.value),
        createdAt: new Date().toISOString(),
        createdByUid: uNow2 && uNow2.uid || '',
        createdByEmail: uNow2 && uNow2.email || ''
      };
      if(!(pay.amount>0)){
        const el = document.querySelector(IDS.payAmountInput);
        showInvalid(el, 'لطفاً مبلغ پرداخت را وارد کنید.');
        return;
      }
      // basic validation: cannot pay principal more than balance
      const loan = state.loans.find(l=> l.id===pay.loanId);
      if(!loan) return alert('قرض یافت نشد');
      // Role-based restriction: limited users may only submit payments for allowed loans
      if(isLimitedUser() && String(loan.creditor||'').trim()!=='سارا' && !canModifyLoan(loan)){
        const el = document.querySelector(IDS.loanSelect);
        showInvalid(el, 'دسترسی برای این قرض محدود است. لطفاً قرض با بستانکار سارا را انتخاب کنید.');
        return;
      }
      if(pay.type==='principal'){
        const d = computeLoanDerived(loan);
        if(pay.amount > d.balance){
          const el = document.querySelector(IDS.payAmountInput);
          showInvalid(el, 'مبلغ پرداخت اصل از مانده بیشتر است');
          return;
        }
      }
      let createdPayId = '';
      const editedPayIdLocal = editingPayId;
      if(editingPayId){
        // confirm save
        const ok = await confirmFa('تغییرات پرداخت ذخیره شود؟');
        if(!ok) return;
        const pays = state.pays.map(x => x.id===editingPayId ? { ...x, ...pay, id: editingPayId } : x);
        state.pays = pays;
        editingPayId = '';
      }else{
        const pays = state.pays; pays.push(pay); state.pays = pays;
        createdPayId = pay.id;
        editingPayId = '';
      }
      try { dbg('payment saved/updated'); } catch {}
      form.reset();
      try{
        const hint = document.querySelector(IDS.payDateHint); if(hint){ hint.textContent=''; try{ if(hint.dataset) delete hint.dataset.frozen; }catch{} }
        const alt = document.querySelector(IDS.payDateAlt); if(alt) alt.value='';
      }catch{}
      refreshLoansTable();
      refreshPaysTable();
      if(submitBtn) submitBtn.textContent = 'ثبت پرداخت';
      if(cancelBtn) cancelBtn.style.display = 'none';
      form.classList.remove('editing');
      // highlight affected payment row
      const targetPayId = createdPayId || editedPayIdLocal;
      if(targetPayId){
        const row = document.querySelector(`#paymentsTable tbody tr[data-id="${targetPayId}"]`);
        if(row){
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('flash-success');
          setTimeout(()=> row.classList.remove('flash-success'), 2000);
        }
      }
    });

    // Handle payments table group toggle + Edit/Delete buttons
    document.querySelector(IDS.paymentsTable)?.addEventListener('click', async (ev)=>{
      // Toggle group open/close
      const toggleBtn = ev.target.closest('.gh-toggle');
      const grpRow = toggleBtn ? toggleBtn.closest('tr.pay-group') : ev.target.closest('tr.pay-group');
      if(toggleBtn || (grpRow && !ev.target.closest('button:not(.gh-toggle)'))){
        const loanId = (toggleBtn?.dataset.loan) || grpRow?.dataset.loan;
        if(loanId){
          const children = Array.from(document.querySelectorAll(`#paymentsTable tbody tr.pay-child[data-loan="${loanId}"]`));
          const collapsed = children.length ? (children[0].style.display==='none') : true;
          children.forEach(tr=>{ tr.style.display = collapsed ? '' : 'none'; });
          const btn = grpRow?.querySelector('.gh-toggle');
          if(btn){ btn.setAttribute('aria-expanded', collapsed? 'true':'false'); btn.classList.toggle('open', collapsed); btn.textContent = collapsed ? '▾' : '▸'; }
          return; // don't fall through when toggling
        }
      }
      const delBtn = ev.target.closest('button[data-act="p-del"]');
      const editBtn = ev.target.closest('button[data-act="p-edit"]');
      const resBtn = ev.target.closest('button[data-act="p-resolve"]');
      if(resBtn){
        const loanId = resBtn.getAttribute('data-loan'); if(loanId) try{ await resolveZeroInstallments(loanId); }catch{}
        return;
      }
      if(delBtn){
        const id = delBtn.getAttribute('data-id');
        if(!id) return;
        const pay = state.pays.find(x=> x.id===id);
        if(pay && !canModifyPayment(pay) && !isAdminUser()) return;
        const ok = await (window.Delete?.ask ? window.Delete.ask('این پرداخت') : confirmFa('این پرداخت حذف شود؟'));
        if(!ok) return;
        state.pays = state.pays.filter(x=> x.id !== id);
        // Refresh both tables because deleting a payment affects loan-derived fields
        refreshPaysTable();
        refreshLoansTable();
        updateSummary();
        return;
      }
      if(editBtn){
        const id = editBtn.getAttribute('data-id');
        if(!id) return;
        const pay = state.pays.find(x=> x.id === id);
        if(pay){
          if(!canModifyPayment(pay) && !isAdminUser()) return;
          const loan = state.loans.find(l=> l.id===pay.loanId);
          const isClosed = loan && loan.status==='closed';
          const isAwait = loan && loan.status==='awaiting';
          const msg = isClosed
            ? 'این وام کامل بازپرداخت شده است. آیا از ویرایش این پرداخت مطمئن هستید؟'
            : (isAwait ? 'این وام در انتظار تسویه اصل است. آیا از ویرایش این پرداخت مطمئن هستید؟' : 'آیا از ویرایش این پرداخت مطمئن هستید؟');
          const ok = await confirmFa(msg);
          if(!ok) return;
          await enterPayEdit(pay);
        }
      }
    });
    // Ensure payment form is cleared on page load/refresh
    try{
      form.reset();
      const clearVal = (sel)=>{ const el = document.querySelector(sel); if(el) el.value=''; };
      clearVal(IDS.payDate);
      clearVal(IDS.payDateAlt);
      clearVal(IDS.payAmountInput);
      const w = document.querySelector(IDS.payAmountWords); if(w) w.textContent='';
      const h = document.querySelector(IDS.payDateHint); if(h) h.textContent='';
      const loanSel = document.querySelector(IDS.loanSelect); if(loanSel) loanSel.value='';
      const typeSel = form.querySelector('[name="type"]'); if(typeSel) typeSel.value='';
      // Keep type and loan selection as-is (defaults), but do not auto-fill amount on load
      form.classList.remove('editing');
      if(submitBtn) submitBtn.textContent = 'ثبت پرداخت';
      if(cancelBtn) cancelBtn.style.display = 'none';
    }catch{}
  }

  async function init(){
    // First, try to restore persisted data from IDB if LS is empty
    try{ await restoreFromIDBIfEmpty(); }catch{}
    refreshLoansTable();
    refreshPaysTable();
    bindLoanForm();
    bindPaymentForm();
    // enable sortable headers
    bindSorting();
    // enable table/cards view toggle
    try{ bindLoansViewToggle(); }catch{}
    // show activity banner immediately and mark as seen
    try{ updateActivityBanner(); touchLastSeen(); }catch{}
    // clear payment filters on load
    try{
      const b = document.querySelector('#payFilterBorrower'); if(b) b.value='';
      const t = document.querySelector('#payFilterType'); if(t) t.value='all';
      const f1 = document.querySelector('#payFilterFrom'); const a1 = document.querySelector('#payFilterFromAlt'); if(f1) f1.value=''; if(a1) a1.value='';
      const f2 = document.querySelector('#payFilterTo'); const a2 = document.querySelector('#payFilterToAlt'); if(f2) f2.value=''; if(a2) a2.value='';
      const h1 = document.getElementById('payFilterFromHint'); if(h1) h1.textContent='';
      const h2 = document.getElementById('payFilterToHint'); if(h2) h2.textContent='';
      refreshPaysTable();
    }catch{}
    // wire archive lock and actions
    bindArchiveControls();
    // ensure summary renders on first load
    try{ updateSummary(); }catch(e){ try{ console.error('updateSummary failed', e); }catch{} }

    // Render today's date banner
    try{ renderTodayBanner(); }catch{}

    // Best-effort: ask the browser to persist this site's storage so data is less likely to be cleared
    try{ await persistStorageIfPossible(); }catch{}

    // Finally, enforce no manual typing for start/pay date fields
    try{ preventManualTypingOn('#startDate'); }catch{}
    // Schedule weekly auto-backup (runs once on load if due). This will also trigger folder picker on first run.
    try{ await window.Backup?.writeWeeklyBackupIfDue?.(exportDataObject); }catch{}
    // Show last backup time
    try{ await refreshLastBackupHint(); }catch{}
    try{
      const btn = document.getElementById('downloadLatestBackup');
      if(btn && !btn.dataset.wired){
        btn.dataset.wired = '1';
        btn.addEventListener('click', async (e)=>{
          e.preventDefault();
          if(btn.dataset.busy === '1') return; // guard against double-trigger
          btn.dataset.busy = '1';
          try{ await window.Backup?.downloadLatestBackup?.(exportDataObject); }catch{}
          // Refresh hint in case OPFS list changed
          try{ await refreshLastBackupHint(); }catch{}
          btn.dataset.busy = '0';
        });
      }
    }catch{}

    // Live hints under date inputs: show Persian + English
    const wireDateHint = (inputSel, hintSel)=>{
      const el = document.querySelector(inputSel);
      const hint = document.querySelector(hintSel);
      if(!el || !hint) return;
      const upd = ()=>{
        // If hint is frozen (set by onSelect), don't override it here
        try{ if(hint.dataset && hint.dataset.frozen === '1') return; }catch{}
        // Prefer hidden ISO value if available (set by datepicker), fallback to parsing input text
        let iso = '';
        try{
          if(inputSel === '#startDate') iso = (document.querySelector('#startDateAlt')?.value) || '';
          else if(inputSel === '#payDate') iso = (document.querySelector('#payDateAlt')?.value) || '';
        }catch{}
        if(!iso) iso = toISO(el.value);
        // If still empty and we are on startDate with a Jalali string, convert it
        if((!iso || !isValidISO(iso)) && (inputSel === '#startDate' || inputSel === '#payDate')){
          try{
            const raw = String(el.value||'').trim();
            if(raw){
              const ascii = normalizeDigits(raw); // e.g., 1404/05/08
              const m = ascii.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
              if(m){
                const jy=parseInt(m[1],10), jm=parseInt(m[2],10), jd=parseInt(m[3],10);
                const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
                const mm = String(gm).padStart(2,'0'); const dd=String(gd).padStart(2,'0');
                iso = `${gy}-${mm}-${dd}`;
              }
            }
          }catch{}
        }
        if(!iso || !isValidISO(iso)){
          hint.textContent = '';
        }else{
          // Prefer ISO derived from visible Jalali text to prevent TZ off-by-one in hint
          let dispISO = iso;
          if(inputSel === '#startDate' || inputSel === '#payDate' || inputSel === '#repaymentDate' || inputSel === '#payFilterFrom' || inputSel === '#payFilterTo'){
            try{
              const raw = String(el.value||'').trim();
              const ascii = normalizeDigits(raw);
              const nums = (ascii.match(/\d+/g) || []).slice(0,3);
              if(nums.length===3){
                const jy = parseInt(nums[0],10), jm = parseInt(nums[1],10), jd = parseInt(nums[2],10);
                if(Number.isFinite(jy) && Number.isFinite(jm) && Number.isFinite(jd)){
                  const [gy,gm,gd] = jalaliToGregorian(jy,jm,jd);
                  const mm = String(gm).padStart(2,'0'); const dd = String(gd).padStart(2,'0');
                  const cand = `${gy}-${mm}-${dd}`;
                  if(isValidISO(cand)) dispISO = cand;
                }
              }
            }catch{}
          }
          // Always derive FA/EN from the same canonical ISO to avoid mismatch
          const fa = fmtFaDate(dispISO);
          const en = fmtEnDate(dispISO);
          hint.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '');
        }
        // keep hidden ISO synced for all date fields and recompute repayment when start date changes
        const mapAlt = {
          '#startDate': '#startDateAlt',
          '#payDate': '#payDateAlt',
          '#repaymentDate': '#repaymentDateAlt',
          '#payFilterFrom': '#payFilterFromAlt',
          '#payFilterTo': '#payFilterToAlt'
        };
        if(mapAlt[inputSel]){
          const altSel = mapAlt[inputSel];
          const alt = document.querySelector(altSel);
          const toSet = (typeof dispISO !== 'undefined' && isValidISO(dispISO)) ? dispISO : iso;
          if(alt && isValidISO(toSet)) alt.value = toSet;
          if(inputSel === '#startDate') recomputeRepaymentFromUI();
        }
      };
      el.addEventListener('change', upd);
      el.addEventListener('input', upd);
      // React to hidden alt changes
      try{
        if(inputSel === '#startDate' || inputSel === '#payDate'){
          const alt = document.querySelector(inputSel === '#startDate' ? '#startDateAlt' : '#payDateAlt');
          alt && alt.addEventListener('input', upd);
          alt && alt.addEventListener('change', upd);
        }
      }catch{}
      upd();
    };
    wireDateHint(IDS.startDate, IDS.startDateHint);
    wireDateHint(IDS.repaymentDate, IDS.repaymentDateHint);
    wireDateHint(IDS.payDate, IDS.payDateHint);

    // Initialize Jalali datepickers (persian-datepicker)
    const initJalali = (inputSel, altSel, hintSel)=>{
      const $inp = window.jQuery && window.jQuery(inputSel);
      const alt = document.querySelector(altSel);
      const hint = document.querySelector(hintSel);
      const inpEl = document.querySelector(inputSel);
      if(!$inp || !$inp.length || !alt || !inpEl) return;
      // Skip attaching datepicker only for display-only fields (e.g., repaymentDate)
      try{ if(inpEl.classList && inpEl.classList.contains('display-only')) return; }catch{}
      try{
        const opts = {
          format: 'YYYY/MM/DD',
          initialValue: false,
          autoClose: true,
          calendarType: 'persian',
          toolbox: { enabled: false },
          onSelect: function(unix){
            if(typeof unix === 'number'){
              let iso = '';
              // Strategy A (primary): get Jalali Y/M/D from persianDate then convert using jalaliToGregorian
              try{
                const PD = (window && (window.persianDate || window.PersianDate)) || null;
                if(PD){
                  const pd = new PD(unix);
                  if(pd){
                    const pc = (typeof pd.toCalendar==='function') ? pd.toCalendar('persian') : null;
                    const yStr = pc && typeof pc.format==='function' ? normalizeDigits(pc.format('YYYY')) : normalizeDigits(pd.format('YYYY'));
                    const mStr = pc && typeof pc.format==='function' ? normalizeDigits(pc.format('M')) : normalizeDigits(pd.format('M'));
                    const dStr = pc && typeof pc.format==='function' ? normalizeDigits(pc.format('D')) : normalizeDigits(pd.format('D'));
                    const jy = parseInt(yStr,10), jm = parseInt(mStr,10), jd = parseInt(dStr,10);
                    if(Number.isFinite(jy) && Number.isFinite(jm) && Number.isFinite(jd)){
                      const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
                      const mm = String(gm).padStart(2,'0');
                      const dd = String(gd).padStart(2,'0');
                      const cand = `${gy}-${mm}-${dd}`;
                      if(isValidISO(cand)) iso = cand;
                      try{ dbg('[DK][calc]', { jy,jm,jd, iso:cand }); }catch{}
                    }
                  }
                }
              }catch{}
              // Strategy B: derive Gregorian Y/M/D directly from persianDate's Gregorian calendar (authoritative)
              try{
                const PD = (window && (window.persianDate || window.PersianDate)) || null;
                if(PD){
                  const pd = new PD(unix);
                  if(pd){
                    let gy=null, gm=null, gd=null;
                    try{
                      const gc = (typeof pd.toCalendar==='function') ? pd.toCalendar('gregorian') : null;
                      if(gc && typeof gc.format==='function'){
                        const yStr = normalizeDigits(gc.format('YYYY'));
                        const mStr = normalizeDigits(gc.format('M'));
                        const dStr = normalizeDigits(gc.format('D'));
                        gy = parseInt(yStr,10);
                        gm = parseInt(mStr,10);
                        gd = parseInt(dStr,10);
                      }
                    }catch{}
                    if(gy && gm && gd){
                      const m2 = String(gm).padStart(2,'0');
                      const d2 = String(gd).padStart(2,'0');
                      const cand = `${gy}-${m2}-${d2}`;
                      if(isValidISO(cand)){
                        iso = cand;
                        // For user-facing fields, trust GC result and bypass other fallbacks
                        if(inputSel === IDS.startDate || inputSel === IDS.payDate){
                          // no-op: iso is final
                        }
                      }
                    }
                  }
                }
              }catch{}
              // Fallbacks when persianDate API is unavailable or GC failed
              if(!isValidISO(iso)){
                const d = new Date(unix);
                // IMPORTANT: use LOCAL components; persian-datepicker gives local midnight.
                // Using UTC here would subtract a day in positive timezones (e.g., Asia/Tehran).
                const y = d.getFullYear();
                const mo = String(d.getMonth()+1).padStart(2,'0');
                const da = String(d.getDate()).padStart(2,'0');
                const cand = `${y}-${mo}-${da}`;
                if(isValidISO(cand)) iso = cand;
              }
              // Final guard (again): if still invalid, retry from visible Jalali
              try{
                if(!isValidISO(iso)){
                  const rawTxt2 = String(inpEl && inpEl.value || '').trim();
                  const ascii2 = normalizeDigits(rawTxt2);
                  const mJ2 = ascii2.match(/^(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})$/);
                  if(mJ2){
                    const jy2 = parseInt(mJ2[1],10), jm2 = parseInt(mJ2[2],10), jd2 = parseInt(mJ2[3],10);
                    const [gy2, gm2, gd2] = jalaliToGregorian(jy2, jm2, jd2);
                    const mm2 = String(gm2).padStart(2,'0');
                    const dd2 = String(gd2).padStart(2,'0');
                    const cand2 = `${gy2}-${mm2}-${dd2}`;
                    if(isValidISO(cand2)) iso = cand2;
                  }
                }
              }catch{}
              // For start/pay fields, prefer ISO derived from visible Jalali text to avoid TZ drift
              if(inputSel === IDS.startDate || inputSel === IDS.payDate){
                try{
                  const rawV = String(inpEl && inpEl.value || '').trim();
                  const asciiV = normalizeDigits(rawV);
                  const numsV = (asciiV.match(/\d+/g) || []).slice(0,3);
                  if(numsV.length===3){
                    const jyv = parseInt(numsV[0],10), jmv = parseInt(numsV[1],10), jdv = parseInt(numsV[2],10);
                    const [gyv, gmv, gdv] = jalaliToGregorian(jyv, jmv, jdv);
                    const mmv = String(gmv).padStart(2,'0');
                    const ddv = String(gdv).padStart(2,'0');
                    const candV = `${gyv}-${mmv}-${ddv}`;
                    if(isValidISO(candV)) iso = candV;
                  }
                }catch{}
              }
              // Final guard removed: use exact ISO derived from selection
              const isoFinal = iso;
              alt.value = isoFinal;
              // Debug: log selected ISO and its FA/EN for critical fields
              try{
                if(inputSel === IDS.startDate || inputSel === IDS.payDate){
                  const faD = fmtFaDate(isoFinal), enD = fmtEnDate(isoFinal);
                  dbg('[DK][onSelect]', inputSel, 'ISO =', isoFinal, '| FA =', faD, '| EN =', enD);
                }
              }catch{}
              if(hint){
                const fa = fmtFaDate(isoFinal);
                const en = fmtEnDate(isoFinal);
                hint.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '');
              }
              // Recompute default repayment when start/repay/pay dates change
              recomputeRepaymentFromUI();
            }
          }
        };
        const attachPicker = ()=>{ try{ $inp.persianDatepicker(opts); inpEl._dpDestroyed = false; }catch{} };
        const destroyPicker = ()=>{ try{ $inp.persianDatepicker('destroy'); }catch{}; inpEl._dpDestroyed = true; };
        // attach initially
        attachPicker();
        // expose helpers for validation handlers
        inpEl._dpAttach = attachPicker;
        inpEl._dpDestroy = destroyPicker;
        // Only open on real user pointer action (not on focus),
        // using mousedown avoids synthetic focus-triggered openings
        const openDpOnPointer = function(){
          try{
            const el = document.querySelector(inputSel);
            if(el){
              el._suppressOpenUntilClick = false;
              // Ensure instance exists; some browsers/plugins lose instance after DOM updates
              try{
                const hasData = (typeof $inp.data==='function') ? !!$inp.data('datepicker') : true;
                if(!hasData){ attachPicker(); inpEl._dpDestroyed = false; }
              }catch{ attachPicker(); inpEl._dpDestroyed = false; }
              if(el._dpDestroyed && typeof el._dpAttach === 'function') el._dpAttach();
            }
          }catch{}
          try{ $inp.persianDatepicker('show'); }catch{ try{ this.click(); }catch{} }
        };
        $inp.on('mousedown', openDpOnPointer);
        $inp.on('click', openDpOnPointer);
        // Keyboard support: Enter/Space opens picker
        try{
          inpEl.addEventListener('keydown', (e)=>{
            if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openDpOnPointer(); }
          });
        }catch{}
        // Guard: when field gains focus due to validation bubble, keep the picker hidden
        const focusGuard = function(){
          try{
            const el = document.querySelector(inputSel);
            if(el && el._suppressOpenUntilClick){ hideJalaliPicker(el); }
          }catch{}
        };
        $inp.on('focus', focusGuard);
        // no external "Today" button
      }catch{}
    };
    // Use vanilla JDP for interactive fields
    const JDP_OPTS = { prefillToday: false, dashWhenEmpty: true, showTodayHintWhenEmpty: true };
    initVanillaJdp(IDS.startDate, IDS.startDateAlt, IDS.startDateHint, JDP_OPTS);
    initVanillaJdp(IDS.payDate, IDS.payDateAlt, IDS.payDateHint, JDP_OPTS);
    initVanillaJdp(IDS.payFilterFrom, IDS.payFilterFromAlt, '#payFilterFromHint', JDP_OPTS);
    initVanillaJdp(IDS.payFilterTo, IDS.payFilterToAlt, '#payFilterToHint', JDP_OPTS);
    // repaymentDate is display-only (auto-computed), no picker needed
    // Global date hint updater (independent of picker)
    (function wireGlobalDateHints(){
      function ensureHint(input, hintSel){
        try{
          let hint = hintSel ? document.querySelector(hintSel) : null;
          if(!hint){
            const s = document.createElement('small');
            s.className='small'; s.style.cssText='display:block; min-height:18px; margin-top:4px; color:#9fb0c9;';
            s.setAttribute('role','status'); s.setAttribute('aria-live','polite');
            if(input && input.id) s.id = input.id + 'Hint';
            // default placement
            if(input && input.parentElement){ input.parentElement.insertAdjacentElement('afterend', s); }
            else if(input){ input.insertAdjacentElement('afterend', s); }
            hint = s;
          }
          // If inside .pay-filters, ensure hint is immediately after input within the label
          try{
            const inFilters = input && input.closest('.pay-filters');
            if(inFilters && hint && hint.previousElementSibling !== input){
              input.insertAdjacentElement('afterend', hint);
            }
          }catch{}
          return hint;
        }catch{ return null; }
      }
      function jalaliInputToISO(val){
        try{
          const raw = vj_normalizeDigits(String(val||'')).trim();
          let m = raw.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
          if(!m && raw){ m = raw.match(/(\d{4}).*?(\d{1,2}).*?(\d{1,2})/); }
          if(m){
            const jy=parseInt(m[1],10), jm=parseInt(m[2],10), jd=parseInt(m[3],10);
            const conv = jalaliToGregorian(jy,jm,jd) || [];
            const gy = Number(conv[0]), gm = Number(conv[1]), gd = Number(conv[2]);
            if(Number.isFinite(gy) && Number.isFinite(gm) && Number.isFinite(gd) && gy>0 && gm>=1 && gm<=12 && gd>=1 && gd<=31){
              const mm=String(gm).padStart(2,'0'); const dd=String(gd).padStart(2,'0');
              const iso0 = `${gy}-${mm}-${dd}`;
              return iso0;
            }
          }
        }catch(e){ }
        return '';
      }
      function todayFA(){ return `${vj_toFaDigits(String((function(){return (function(){try{const now=new Date();const dUTC=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));const y=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{timeZone:'UTC',year:'numeric'}).format(dUTC);return parseInt(vj_normalizeDigits(y),10);}catch{return ty;}})();})()))} ${faMonths[tM-1]} ${vj_toFaDigits(String(tD))}`; }
      function todayEN(){ const now=new Date(); const dUTC=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())); const w=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dUTC.getUTCDay()]; const mon=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dUTC.getUTCMonth()]; return `${w}, ${String(dUTC.getUTCDate()).padStart(2,'0')} ${mon} ${dUTC.getUTCFullYear()}`; }
      function updateDateHint(inputSel, altSel, hintSel){
        try{
          const input=document.querySelector(inputSel); if(!input) return;
          const hint=ensureHint(input,hintSel); if(!hint) return;
          const alt=document.querySelector(altSel||'');
          let iso = alt && isValidISO(String(alt.value||'')) ? String(alt.value) : jalaliInputToISO(input.value);
          let fa = iso ? fmtFaDate(iso) : '';
          let en = iso ? fmtEnDate(iso) : '';
          if(!fa || !en){ fa = todayFA(); en = todayEN(); }
          const txt = `${fa} — ${en}`;
          hint.textContent = txt;
          try{ input.title = txt; }catch{}
        }catch{}
      }
      function bind(inputSel, altSel, hintSel){
        const input=document.querySelector(inputSel); if(!input) return;
        ensureHint(input, hintSel); updateDateHint(inputSel, altSel, hintSel);
        input.addEventListener('change', ()=>updateDateHint(inputSel, altSel, hintSel));
        input.addEventListener('input', ()=>updateDateHint(inputSel, altSel, hintSel));
        const alt=document.querySelector(altSel||''); if(alt){ alt.addEventListener('change', ()=>updateDateHint(inputSel, altSel, hintSel)); }
      }
      bind(IDS.startDate, IDS.startDateAlt, IDS.startDateHint);
      bind(IDS.payDate, IDS.payDateAlt, IDS.payDateHint);
      bind(IDS.payFilterFrom, IDS.payFilterFromAlt, '#payFilterFromHint');
      bind(IDS.payFilterTo, IDS.payFilterToAlt, '#payFilterToHint');
      try{ window.addEventListener('DOMContentLoaded', ()=>{
        updateDateHint(IDS.startDate, IDS.startDateAlt, IDS.startDateHint);
        updateDateHint(IDS.payDate, IDS.payDateAlt, IDS.payDateHint);
        updateDateHint(IDS.payFilterFrom, IDS.payFilterFromAlt, '#payFilterFromHint');
        updateDateHint(IDS.payFilterTo, IDS.payFilterToAlt, '#payFilterToHint');
      }); }catch{}
    })();
    // React to filter inputs
    document.querySelector(IDS.payFilterBorrower)?.addEventListener('input', refreshPaysTableDebounced);
    document.querySelector(IDS.payFilterType)?.addEventListener('change', refreshPaysTable);
    document.querySelector(IDS.payFilterFrom)?.addEventListener('change', refreshPaysTableDebounced);
    document.querySelector(IDS.payFilterTo)?.addEventListener('change', refreshPaysTableDebounced);
    document.querySelector(IDS.payFilterClear)?.addEventListener('click', ()=>{
      const b = document.querySelector(IDS.payFilterBorrower); if(b) b.value='';
      const t = document.querySelector(IDS.payFilterType); if(t) t.value='all';
      const f1 = document.querySelector(IDS.payFilterFrom); const a1 = document.querySelector(IDS.payFilterFromAlt); if(f1) f1.value=''; if(a1) a1.value='';
      const f2 = document.querySelector(IDS.payFilterTo); const a2=document.querySelector(IDS.payFilterToAlt); if(f2) f2.value=''; if(a2) a2.value='';
      // clear hints under filter inputs
      try{
        const h1 = document.getElementById('payFilterFromHint'); if(h1) h1.textContent='';
        const h2 = document.getElementById('payFilterToHint'); if(h2) h2.textContent='';
        if(f1) f1.title=''; if(f2) f2.title='';
      }catch{}
      refreshPaysTable();
    });

    // First-time prefill if inputs already have values
    recomputeRepaymentFromUI();

    // Force-refresh date hints from hidden ISO once (fix stale one-day-off hints frozen earlier)
    try{
      const sAlt = document.querySelector(IDS.startDateAlt);
      const sHint = document.querySelector(IDS.startDateHint);
      if(sAlt && sHint){
        const iso = String(sAlt.value||'');
        if(iso){
          const fa = fmtFaDate(iso), en = fmtEnDate(iso);
          try{ if(sHint.dataset) delete sHint.dataset.frozen; }catch{}
          sHint.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '');
        }
      }
      const pAlt = document.querySelector(IDS.payDateAlt);
      const pHint = document.querySelector(IDS.payDateHint);
      if(pAlt && pHint){
        const iso = String(pAlt.value||'');
        if(iso){
          const fa = fmtFaDate(iso), en = fmtEnDate(iso);
          try{ if(pHint.dataset) delete pHint.dataset.frozen; }catch{}
          pHint.textContent = (fa && en) ? `${fa} — ${en}` : (fa || en || '');
        }
      }
    }catch{}

    // Backup/Restore: export JSON button removed per request (no extra handlers here)
    $('#importJson')?.addEventListener('change', async (e)=>{
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      try{
        const txt = await f.text();
        const obj = JSON.parse(txt);
        const ok = await confirmFa('اطلاعات فعلی با فایل انتخابی جایگزین شود؟', { okText:'بله', cancelText:'انصراف' });
        if(!ok) return;
        if(Array.isArray(obj.loans)) state.loans = obj.loans; else state.loans = [];
        if(Array.isArray(obj.payments)) state.pays = obj.payments; else state.pays = [];
        refreshLoansTable();
        refreshPaysTable();
      }catch(err){ try{ await confirmFa('فایل معتبر نیست', { okText:'باشه', cancelText:'انصراف' }); }catch{} }
      e.target.value = '';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
  
  // Expose UI refreshers for external triggers (firebase onSnapshot/load)
  try{
    window.refreshLoansTable = refreshLoansTable;
    window.refreshPaysTable  = refreshPaysTable;
    window.updateSummary     = updateSummary;
  }catch{}

  // Expose a tiny helper to dump current start/pay ISO + FA/EN in console
  try{
    window.dkLogDates = function(){
      try{
        const sAlt = document.querySelector('#startDateAlt')?.value || '';
        const pAlt = document.querySelector('#payDateAlt')?.value || '';
        const out = {
          startAltISO: sAlt,
          startFA: sAlt ? fmtFaDate(sAlt) : '',
          startEN: sAlt ? fmtEnDate(sAlt) : '',
          payAltISO: pAlt,
          payFA: pAlt ? fmtFaDate(pAlt) : '',
          payEN: pAlt ? fmtEnDate(pAlt) : ''
        };
        dbg('[DK][dkLogDates]', out);
        return out;
      }catch(e){ console.error('[DK][dkLogDates] error', e); return null; }
    };
  }catch{}
})();

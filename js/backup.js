// backup.js — encapsulated backup utilities (no module loader required)
// Exposes window.Backup with methods:
//   - writeWeeklyBackupIfDue(getDataObject)
//   - downloadLatestBackup(getDataObject)
//   - initScheduler(getDataObject)  // schedules weekly auto-backup (Friday morning) and keeps hint fresh
// getDataObject: () => { loans:[], payments:[], version, exportedAt }

(function(){
  const ns = {};

  function isoDateOnly(d){
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth()+1).padStart(2,'0');
    const da = String(d.getUTCDate()).padStart(2,'0');
    return `${y}-${m}-${da}`;
  }

  function updateHint(ts){
    try{
      const el = document.getElementById('lastBackupHint');
      if(!el) return;
      if(!ts){ el.textContent = '—'; el.classList.remove('ok','stale'); return; }
      const d = new Date(ts);
      // Local date + time short
      const dateStr = d.toLocaleString('fa-IR', { dateStyle:'medium', timeStyle:'short' });
      const ageMs = Date.now() - d.getTime();
      const sevenDays = 7*24*60*60*1000;
      const isFresh = ageMs <= sevenDays;
      el.classList.remove('ok','stale');
      el.classList.add(isFresh? 'ok' : 'stale');
      const ico = isFresh? '✅' : '⚠️';
      el.innerHTML = `${ico} آخرین پشتیبان موفق: ${dateStr}`;
    }catch{}
  }

  async function ensureBackupsDir(){
    try{
      if(!('storage' in navigator) || typeof navigator.storage.getDirectory !== 'function') return null;
      const root = await navigator.storage.getDirectory();
      return await root.getDirectoryHandle('BACKUP', { create: true });
    }catch{ return null; }
  }

  ns.writeWeeklyBackupIfDue = async (getDataObject)=>{
    try{
      const dir = await ensureBackupsDir();
      if(!dir) return; // OPFS not supported
      const LAST_KEY = 'dk_last_backup_at';
      const last = localStorage.getItem(LAST_KEY);
      const nowDate = new Date();
      const isFriday = nowDate.getDay() === 5; // 0=Sun ... 5=Fri
      const hour = nowDate.getHours();
      // Only proceed exactly at hour 8 local time (we check hourly)
      if(!(isFriday && hour === 8)) { updateHint(last); return; }
      // Skip if we already backed up today
      if(last){
        const lastD = new Date(last);
        const sameDay = lastD.getFullYear()===nowDate.getFullYear() && lastD.getMonth()===nowDate.getMonth() && lastD.getDate()===nowDate.getDate();
        if(sameDay){ updateHint(last); return; }
      }
      const obj = (typeof getDataObject === 'function') ? getDataObject() : {};
      const name = `backup_${isoDateOnly(new Date())}.json`;
      const fh = await dir.getFileHandle(name, { create: true });
      const w = await fh.createWritable();
      await w.write(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
      await w.close();
      const iso = new Date().toISOString();
      localStorage.setItem(LAST_KEY, iso);
      updateHint(iso);
      // Best-effort: also trigger a user-download as secondary backup (may be blocked)
      try{
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=> URL.revokeObjectURL(url), 2000);
      }catch{}
      // prune: keep only latest
      try{
        const entries = [];
        for await (const [key, handle] of dir.entries()){
          if(handle.kind === 'file' && /^backup_\d{4}-\d{2}-\d{2}\.json$/.test(key)) entries.push({key, handle});
        }
        entries.sort((a,b)=> a.key.localeCompare(b.key));
        while(entries.length > 1){
          const old = entries.shift();
          try{ await dir.removeEntry(old.key); }catch{}
        }
      }catch{}
    }catch{}
  };

  ns.downloadLatestBackup = async (getDataObject)=>{
    try{
      const dir = await ensureBackupsDir();
      if(dir){
        // Always (over)write today's backup before downloading to ensure fresh data
        const name = `backup_${isoDateOnly(new Date())}.json`;
        const obj = (typeof getDataObject === 'function') ? getDataObject() : {};
        const fh = await dir.getFileHandle(name, { create: true });
        const w = await fh.createWritable();
        await w.write(new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' }));
        await w.close();
        // prune others, keep only latest
        try{
          const entries = [];
          for await (const [key, handle] of dir.entries()){
            if(handle.kind === 'file' && /^backup_\d{4}-\d{2}-\d{2}\.json$/.test(key)) entries.push({key, handle});
          }
          entries.sort((a,b)=> a.key.localeCompare(b.key));
          while(entries.length > 1){ const old = entries.shift(); try{ await dir.removeEntry(old.key); }catch{} }
        }catch{}
        // Download the file we just wrote
        const file = await fh.getFile();
        const url = URL.createObjectURL(file);
        const a = document.createElement('a'); a.href=url; a.download=name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=> URL.revokeObjectURL(url), 2000);
        return;
      }
    }catch{}
    // fallback: export current state
    try{
      const obj = (typeof getDataObject === 'function') ? getDataObject() : {};
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup_${isoDateOnly(new Date())}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=> URL.revokeObjectURL(url), 2000);
    }catch{}
  };

  window.Backup = ns;
})();

// utils/date.js
// Date helpers and Persian/Gregorian formatting

/** @param {string} iso */
export function isValidISO(iso){
  if(!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime()) && iso === d.toISOString().slice(0,10);
}

/** @param {string} a @param {string} b */
export function compareISO(a,b){
  if(!isValidISO(a) || !isValidISO(b)) return NaN;
  return a.localeCompare(b);
}

/** @param {string|Date} s */
export function toISO(s){
  return s ? new Date(s).toISOString().slice(0,10) : '';
}

/** Add m months to dateStr keeping day of month stable */
export function addMonths(dateStr, m){
  const d = new Date(dateStr);
  const t = new Date(d.getTime());
  t.setMonth(t.getMonth() + m);
  if(t.getDate() !== d.getDate()) t.setDate(0);
  return t.toISOString().slice(0,10);
}

/** Month difference counting current month if end day >= start day */
export function monthsDiff(isoStart, isoEnd){
  try{
    if(!isoStart || !isoEnd) return 0;
    const s = new Date(isoStart), e = new Date(isoEnd);
    let total = (e.getFullYear()-s.getFullYear())*12 + (e.getMonth()-s.getMonth());
    if(e.getDate() >= s.getDate()) total += 1;
    return Math.max(0, total);
  }catch{ return 0; }
}

/** @param {string} iso */
export function fmtFaDate(iso){
  if(!iso) return '';
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('fa-IR-u-ca-persian', { year:'numeric', month:'long', day:'numeric' });
  }catch{return ''}
}

/** @param {string} iso */
export function fmtEnDate(iso){
  if(!iso) return '';
  try{
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'2-digit' });
  }catch{return ''}
}

/** @param {string} iso */
export function fmtFaYMD(iso){
  if(!iso) return '';
  try{
    const d = new Date(iso);
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year:'numeric', month:'2-digit', day:'2-digit' }).format(d);
  }catch{return ''}
}

/** @param {string} iso */
export function bothDatesHTML(iso){
  const fa = fmtFaDate(iso), en = fmtEnDate(iso);
  if(!fa && !en) return '—';
  return `<div>${fa}</div><div class="small" style="opacity:.8">${en}</div>`;
}

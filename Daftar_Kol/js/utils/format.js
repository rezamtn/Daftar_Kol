// utils/format.js
// Number/digit formatting helpers for Persian UI

/**
 * Normalize Persian/Arabic-Indic digits to Latin digits.
 * @param {string|number|null|undefined} s
 * @returns {string}
 */
export function normalizeDigits(s){
  if(s==null) return '';
  const map = {
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
  };
  let out = '';
  for(const ch of String(s)) out += (map[ch] ?? ch);
  return out;
}

/**
 * Parse a localized numeric string to Number.
 * Keeps digits, minus sign and dot.
 * @param {string|number|null|undefined} v
 * @returns {number}
 */
export function parseNum(v){
  if(v==null) return 0;
  const latin = normalizeDigits(v).replace(/[^0-9.-]/g,'');
  const n = Number(latin);
  return Number.isFinite(n)? n: 0;
}

/**
 * Convert Latin digits to Persian digits in a string.
 * @param {string|number} s
 * @returns {string}
 */
export function toFaDigits(s){
  const map = {'0':'۰','1':'۱','2':'۲','3':'۳','4':'۴','5':'۵','6':'۶','7':'۷','8':'۸','9':'۹'};
  let t=''; for(const ch of String(s)) t += (map[ch] ?? ch); return t;
}

/**
 * Format integer with thousand separators and Persian digits.
 * @param {number|string} n
 * @returns {string}
 */
export function faFormatInt(n){
  return toFaDigits(Number(n).toLocaleString('en-US'));
}

/**
 * Format number as toman with Persian locale digits.
 * @param {number} n
 */
export function fmtTom(n){
  return Number(n).toLocaleString('fa-IR');
}

/**
 * Keep only ASCII digits and dot, but show Persian digits in the field.
 * Useful for decimal text inputs.
 * @param {HTMLInputElement|null} inputEl
 */
export function attachDecimalFaDot(inputEl){
  if(!inputEl) return;
  inputEl.addEventListener('input', ()=>{
    try{
      const ascii = normalizeDecimalAscii(inputEl.value);
      inputEl.value = toFaDigits(ascii); // Persian digits, '.' intact
    }catch{}
  });
}

/**
 * Normalize decimals: convert localized digits and separators to ASCII digits + single dot.
 * @param {string} s
 */
export function normalizeDecimalAscii(s){
  const str = String(s ?? '');
  const digits = normalizeDigits(str)
    .replace(/[\u066B\u060C،,]/g, '.')
    .replace(/[^0-9.]/g, '');
  return digits.replace(/\.(?=.*\.)/g, '');
}

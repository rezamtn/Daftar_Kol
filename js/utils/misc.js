// utils/misc.js
/**
 * Simple debounce utility.
 * @template {(...args:any[])=>any} F
 * @param {F} fn
 * @param {number} wait
 * @returns {F}
 */
export function debounce(fn, wait){
  let t = null;
  return function(...args){
    if(t) clearTimeout(t);
    t = setTimeout(()=>{ fn.apply(this, args); }, wait);
  };
}

// Firebase integration for Daftar_Kol (households/familyA)
// This file is an ES module and exposes window.firebaseApi for app.js to use.

import { firebaseConfig } from './firebase.config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DOC_PATH = 'households/familyA';
let unsubRT = null;
let updatingFromRemote = false;
let lastSavedHash = '';

// --- UI helpers (banner + cloud status) ---
function ensureBanner(){
  try{
    const headTop = document.querySelector('.head-top');
    if(!headTop) return null;
    let el = document.getElementById('loginNotice');
    if(!el){
      el = document.createElement('div');
      el.id = 'loginNotice';
      el.className = 'small';
      el.style.cssText = 'margin-top:6px; padding:8px; border-radius:8px; background:#2a1b1b; color:#f5b1b1; border:1px solid #512; display:none;';
      el.textContent = 'بدون ورود، اطلاعات ذخیره ابری و همگام‌سازی انجام نمی‌شود.';
      headTop.appendChild(el);
    }
    return el;
  }catch{ return null; }
}
function ensureCloudStatus(){
  try{
    const headMeta = document.querySelector('.head-top .head-meta');
    const authBox = document.getElementById('authControls');
    const host = authBox || headMeta || document.querySelector('.head-top') || document.body;
    let el = document.getElementById('cloudStatus');
    if(!el){
      el = document.createElement('div');
      el.id = 'cloudStatus';
      el.className = 'small';
      el.style.cssText = 'margin-top:6px; color:#9fb0c9;';
      host.appendChild(el);
    }
    return el;
  }catch{ return null; }
}
function setCloudStatus(text){
  try{ const el = ensureCloudStatus(); if(el) el.textContent = text || ''; }catch{}
}

async function loadFromCloud(){
  const ref = doc(db, ...DOC_PATH.split('/'));
  const snap = await getDoc(ref);
  if(!snap.exists()) return { loans: [], payments: [] };
  const data = snap.data() || {};
  return { loans: data.loans || [], payments: data.payments || [] };
}

async function saveToCloud(loans, payments){
  const ref = doc(db, ...DOC_PATH.split('/'));
  await setDoc(ref, {
    loans: Array.isArray(loans)? loans : [],
    payments: Array.isArray(payments)? payments : [],
    updatedAt: serverTimestamp()
  }, { merge: true });
}

function computeHash(loans, payments){
  try{ return JSON.stringify({loans, payments}); }catch{ return Math.random()+''; }
}

function getCurrentState(){
  const loans = (window.state && window.state.loans) || [];
  const payments = (window.state && window.state.pays) || [];
  return { loans, payments };
}

async function autoSaveIfChanged(){
  const { loans, payments } = getCurrentState();
  const h = computeHash(loans, payments);
  if(updatingFromRemote) return; // ignore while applying remote
  if(h !== lastSavedHash){
    try{
      setCloudStatus('Saving…');
      await saveToCloud(loans, payments);
      lastSavedHash = h;
      try{
        const d = new Date();
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        setCloudStatus(`Saved at ${hh}:${mm}`);
      }catch{ setCloudStatus('Saved'); }
    }catch(e){ /* swallow; will retry next tick */ }
  }
}

function setUIState(user){
  const box = document.getElementById('authControls');
  if(!box) return;
  const loggedOut = box.querySelector('[data-when="out"]');
  const loggedIn  = box.querySelector('[data-when="in"]');
  const emailSpan = box.querySelector('#authEmail');
  if(user){
    if(emailSpan) emailSpan.textContent = user.email || user.uid;
    if(loggedOut) loggedOut.style.display = 'none';
    if(loggedIn) loggedIn.style.display = '';
    try{ const bn = ensureBanner(); if(bn) bn.style.display='none'; }catch{}
    setCloudStatus('');
  }else{
    if(loggedOut) loggedOut.style.display = '';
    if(loggedIn) loggedIn.style.display = 'none';
    try{ const bn = ensureBanner(); if(bn) bn.style.display=''; }catch{}
    setCloudStatus('');
  }
}

function bindAuthUI(){
  const box = document.getElementById('authControls');
  if(!box || box._bound) return; box._bound = true;
  const emailInp = box.querySelector('#authEmailInput');
  const passInp  = box.querySelector('#authPassInput');
  const loginBtn = box.querySelector('#btnLogin');
  const logoutBtn= box.querySelector('#btnLogout');
  const loadBtn  = document.getElementById('btnCloudLoad');
  const saveBtn  = document.getElementById('btnCloudSave');

  if(loginBtn){
    loginBtn.addEventListener('click', async ()=>{
      const email = (emailInp?.value||'').trim();
      const pass  = (passInp?.value||'').trim();
      if(!email || !pass){ alert('Enter email and password'); return; }
      try{ await signInWithEmailAndPassword(auth, email, pass); }
      catch(err){ console.error(err); alert('Login failed'); }
    });
  }
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      try{ await fbSignOut(auth); }catch{}
    });
  }
  if(loadBtn){
    loadBtn.addEventListener('click', async ()=>{
      try{
        setCloudStatus('Loading…');
        const { loans, payments } = await loadFromCloud();
        window.state = window.state || {};
        window.state.loans = loans;
        window.state.pays  = payments;
        try{ localStorage.setItem('dk::loans', JSON.stringify(loans)); }catch{}
        try{ localStorage.setItem('dk::payments', JSON.stringify(payments)); }catch{}
        try{ window.refreshLoansTable && window.refreshLoansTable(); }catch{}
        try{ window.refreshPaysTable && window.refreshPaysTable(); }catch{}
        try{ window.updateSummary && window.updateSummary(); }catch{}
        setCloudStatus('Loaded');
        alert('Cloud data loaded.');
      }catch(err){ console.error(err); alert('Load failed'); }
    });
  }
  if(saveBtn){
    saveBtn.addEventListener('click', async ()=>{
      try{
        setCloudStatus('Saving…');
        const loans = (window.state && window.state.loans) || [];
        const payments = (window.state && window.state.pays) || [];
        await saveToCloud(loans, payments);
        setCloudStatus('Saved');
        alert('Saved to cloud.');
      }catch(err){ console.error(err); alert('Save failed'); }
    });
  }
}

onAuthStateChanged(auth, (user)=>{
  setUIState(user);
  try{
    const cont = document.getElementById('protectedApp');
    if(cont) cont.style.display = user? '' : 'none';
  }catch{}
  // Real-time listener setup/teardown
  try{ if(unsubRT){ unsubRT(); unsubRT = null; } }catch{}
  if(user){
    const ref = doc(db, ...DOC_PATH.split('/'));
    unsubRT = onSnapshot(ref, (snap)=>{
      if(!snap.exists()) return;
      const data = snap.data() || {};
      const remote = { loans: data.loans || [], payments: data.payments || [] };
      const remoteHash = computeHash(remote.loans, remote.payments);
      const { loans, payments } = getCurrentState();
      const localHash = computeHash(loans, payments);
      if(remoteHash !== localHash){
        updatingFromRemote = true;
        try{
          window.state = window.state || {};
          window.state.loans = remote.loans;
          window.state.pays  = remote.payments;
          try{ localStorage.setItem('dk::loans', JSON.stringify(remote.loans)); }catch{}
          try{ localStorage.setItem('dk::payments', JSON.stringify(remote.payments)); }catch{}
          try{ window.refreshLoansTable && window.refreshLoansTable(); }catch{}
          try{ window.refreshPaysTable && window.refreshPaysTable(); }catch{}
          try{ window.updateSummary && window.updateSummary(); }catch{}
          lastSavedHash = remoteHash;
        }finally{
          updatingFromRemote = false;
        }
      }
    });
  }
});

// Expose a small API if needed elsewhere
window.firebaseApi = {
  auth, db, loadFromCloud, saveToCloud
};

// Try to bind UI after DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', bindAuthUI);
}else{ bindAuthUI(); }

// Periodic auto-save while logged in
setInterval(()=>{
  if(auth.currentUser){ autoSaveIfChanged(); }
}, 5000);

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const API_BASE = 'https://lsrta-api.daniela-e0c.workers.dev';
export const ADMIN_EMAILS = ['daniela@legacy-hb.com'];
export const PORTFOLIOS = { all:'All Portfolios', nc_gladysh:'NC Gladysh Capital', sc_platinum:'SC Platinum Estates', tx_acorn:'TX Acorn Ridge' };

export const firebaseConfig = {
  apiKey: 'AIzaSyBqicfh19lQuJbe9Gz8TWyVoEsjbGg7SC4',
  authDomain: 'lsrta-portal.firebaseapp.com',
  projectId: 'lsrta-portal',
  storageBucket: 'lsrta-portal.firebasestorage.app',
  messagingSenderId: '1030135995707',
  appId: '1:1030135995707:web:65a856e90b65b49d53f08e'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export function $(id){ return document.getElementById(id); }
export function show(el,msg){ const n=typeof el==='string'?$(el):el; if(!n) return; n.textContent=msg||n.textContent; n.classList.add('show'); }
export function hide(el){ const n=typeof el==='string'?$(el):el; if(n) n.classList.remove('show'); }
export function money(n){ return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(n||0)); }
export function pct(n){ return Number(n||0).toFixed(1)+'%'; }
export function today(){ return new Date().toISOString().slice(0,10); }
export function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
export function fileExt(name){ return (name.split('.').pop()||'').toLowerCase(); }
export function validateTextFile(file){ const ok=['csv','txt'].includes(fileExt(file.name)); if(!ok) throw new Error(`${file.name} is not supported in the browser upload. Use CSV or TXT, or use AppFolio Sync for API data.`); }
export function readText(file){ validateTextFile(file); return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(String(r.result||'')); r.onerror=()=>reject(new Error('Could not read '+file.name)); r.readAsText(file); }); }
export async function askAI(prompt, maxTokens=1800){ const res=await fetch(API_BASE+'/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-3-5-sonnet-20241022',max_tokens:maxTokens,messages:[{role:'user',content:prompt}]})}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error?.message||data.error||`AI request failed (${res.status})`); return data.content?.[0]?.text || data.text || JSON.stringify(data,null,2); }
export async function api(path, body){ const res=await fetch(API_BASE+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}); const data=await res.json().catch(()=>({})); if(!res.ok || data.success===false) throw new Error(data.error||data.message||`Request failed (${res.status})`); return data; }
export function requireLogin(cb){ onAuthStateChanged(auth,user=>{ if(!user){ location.href='index.html'; return; } setUserChrome(user); cb?.(user); }); }
export function setUserChrome(user){ const name=user.displayName || user.email?.split('@')[0] || 'User'; const init=(name[0]||'?').toUpperCase(); document.querySelectorAll('[data-user-name]').forEach(e=>e.textContent=name); document.querySelectorAll('[data-user-email]').forEach(e=>e.textContent=user.email||''); document.querySelectorAll('[data-user-initial]').forEach(e=>e.textContent=init); const admin=ADMIN_EMAILS.includes((user.email||'').toLowerCase()); document.querySelectorAll('[data-admin-only]').forEach(e=>e.style.display=admin?'':'none'); }
export async function doLogin(email,password){ return signInWithEmailAndPassword(auth,email,password); }
export async function doSignup(name,email,password){ const cred=await createUserWithEmailAndPassword(auth,email,password); if(name) await updateProfile(cred.user,{displayName:name}); await setDoc(doc(db,'users',cred.user.uid),{uid:cred.user.uid,name,email,role:ADMIN_EMAILS.includes(email.toLowerCase())?'admin':'member',createdAt:serverTimestamp()},{merge:true}); return cred; }
export async function doSignOut(){ await signOut(auth); location.href='index.html'; }
window.doSignOut=doSignOut;
export function shell(active,title,subtitle=''){ const nav=[['dashboard.html','🏠','Dashboard'],['reports.html','📊','Reports'],['bulk.html','📦','Bulk Analysis'],['compare.html','🔄','Compare'],['rentroll.html','📋','Rent Roll'],['chat.html','💬','Team Chat'],['admin.html','⚙️','Admin Panel','admin']]; return `<div class="app"><aside class="sidebar"><div class="sb-brand"><div class="brand-eye">Internal Portal</div><div class="sb-name">Legacy<br><span>Signature</span></div><div class="brand-sub">Rental Trend Analyzer</div></div><nav class="nav"><div class="nav-label">Main</div>${nav.map((n,i)=>`${i===5?'<div class="nav-label">Team</div>':''}${i===6?'<div class="nav-label">Admin</div>':''}<a ${n[3]?'data-admin-only':''} class="${active===n[0]?'active':''}" href="${n[0]}"><span>${n[1]}</span>${n[2]}</a>`).join('')}</nav><div class="sb-foot"><div class="user-row"><span class="avatar" data-user-initial>?</span><div><div data-user-name>Loading...</div><div class="muted" data-user-email></div></div></div><button class="btn btn-outline" onclick="doSignOut()" style="width:100%;color:rgba(255,255,255,.7);border-color:rgba(255,255,255,.2)">Sign Out</button></div></aside><main class="main"><div class="topbar"><div><div class="page-title">${title}</div><div class="muted">${subtitle}</div></div></div><div class="content" id="pageContent"></div></main></div>`; }
export async function saveReport(payload){ const user=auth.currentUser; return addDoc(collection(db,'reports'),{...payload,userId:user?.uid||null,userEmail:user?.email||null,createdAt:serverTimestamp(),timestamp:Date.now()}); }
export async function loadReports(){ const q=query(collection(db,'reports'),orderBy('timestamp','desc'),limit(80)); const snap=await getDocs(q); return snap.docs.map(d=>({id:d.id,...d.data()})); }
export async function saveKpis(payload){ const id=[payload.portfolio,payload.type,payload.from_date,payload.to_date].join('_'); await setDoc(doc(db,'kpis',id),{...payload,updatedAt:serverTimestamp(),timestamp:Date.now()},{merge:true}); return id; }
export async function loadKpis(){ const q=query(collection(db,'kpis'),orderBy('timestamp','desc'),limit(100)); const snap=await getDocs(q); return snap.docs.map(d=>({id:d.id,...d.data()})); }

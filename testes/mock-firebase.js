// Firebase "compat" simulado para testes locais do MetaTreino (sem rede, sem conta real).
// Guarda os documentos em memória + localStorage('__mock_fs') para sobreviver a recarregamentos.
(function(){
  const LS = '__mock_fs';
  let store = {};
  try{ store = JSON.parse(localStorage.getItem(LS) || '{}'); }catch(e){}
  const persist = ()=>{ try{ localStorage.setItem(LS, JSON.stringify(store)); }catch(e){} };
  window.__mockFS = store;
  window.__mockWrites = [];
  const MOCK_USER = window.__MOCK_USER || { uid:'aluno-teste', email:'aluno.teste@example.com', displayName:'Aluno Teste', emailVerified:true };
  const now = Date.now();
  // aluno autorizado por padrão
  if(!store['usuariosAutorizados/'+MOCK_USER.email]) store['usuariosAutorizados/'+MOCK_USER.email] = { active:true, expiresAt:null, name:'Aluno Teste' };
  function snap(path){ const d = store[path]; return { exists: d !== undefined, id: path.split('/').pop(), data: ()=> d === undefined ? undefined : JSON.parse(JSON.stringify(d)), ref:{ path } }; }
  function validaFirestore(v, p){
    if(v === undefined) throw new Error('Function setDoc() called with invalid data. Unsupported field value: undefined (' + p + ')');
    if(typeof v === 'number' && !isFinite(v)) return; // Firestore aceita NaN, mas registramos
    if(Array.isArray(v)) v.forEach((x,i)=>{ if(Array.isArray(x)) throw new Error('Nested arrays are not supported (' + p + '['+i+'])'); validaFirestore(x, p+'['+i+']'); });
    else if(v && typeof v === 'object'){ Object.keys(v).forEach(k=>{ if(/^__.*__$/.test(k)) throw new Error('reserved field ' + k); validaFirestore(v[k], p+'.'+k); }); }
  }
  function docRef(path){
    return {
      id: path.split('/').pop(), path,
      get: ()=>Promise.resolve(snap(path)),
      set: (data, opt)=>{ try{ validaFirestore(data, path); }catch(e){ return Promise.reject(e); } window.__mockWrites.push({path, at:Date.now(), bytes: JSON.stringify(data).length}); store[path] = (opt && opt.merge) ? Object.assign({}, store[path]||{}, data) : JSON.parse(JSON.stringify(data)); persist(); return Promise.resolve(); },
      update: (data)=>{ store[path] = Object.assign({}, store[path]||{}, data); persist(); return Promise.resolve(); },
      delete: ()=>{ delete store[path]; persist(); return Promise.resolve(); },
      collection: (c)=>colRef(path+'/'+c),
      onSnapshot: (cb)=>{ setTimeout(()=>cb(snap(path)), 0); return ()=>{}; }
    };
  }
  function colRef(path){
    const q = {
      doc: (id)=>docRef(path+'/'+(id || ('auto'+Math.random().toString(36).slice(2,10)))),
      add: (data)=>{ const id='auto'+Math.random().toString(36).slice(2,10); store[path+'/'+id]=JSON.parse(JSON.stringify(data)); persist(); return Promise.resolve(docRef(path+'/'+id)); },
      where: ()=>q, orderBy: ()=>q, limit: ()=>q, startAfter: ()=>q,
      get: ()=>{ const pre = path+'/'; const docs = Object.keys(store).filter(k=>k.startsWith(pre) && !k.slice(pre.length).includes('/')).map(k=>snap(k)); return Promise.resolve({ docs, size:docs.length, empty:!docs.length, forEach:(f)=>docs.forEach(f) }); },
      onSnapshot: (cb)=>{ setTimeout(()=>q.get().then(cb), 0); return ()=>{}; }
    };
    return q;
  }
  const authListeners = [];
  const auth = {
    currentUser: null,
    onAuthStateChanged(cb){ authListeners.push(cb); setTimeout(()=>{ auth.currentUser = window.__MOCK_LOGGED_OUT ? null : MOCK_USER; cb(auth.currentUser); }, 30); return ()=>{}; },
    signOut(){ auth.currentUser = null; authListeners.forEach(f=>f(null)); return Promise.resolve(); },
    signInWithPopup(){ return Promise.resolve({ user: MOCK_USER }); },
    signInWithEmailAndPassword(){ return Promise.resolve({ user: MOCK_USER }); },
    createUserWithEmailAndPassword(){ return Promise.resolve({ user: MOCK_USER }); },
    sendPasswordResetEmail(){ return Promise.resolve(); },
    setPersistence(){ return Promise.resolve(); }
  };
  const fsFn = ()=>fs;
  const fs = {
    collection: colRef, doc: docRef,
    enablePersistence: ()=>Promise.resolve(),
    batch: ()=>{ const ops=[]; return { set:(r,d)=>ops.push(()=>r.set(d)), delete:(r)=>ops.push(()=>r.delete()), update:(r,d)=>ops.push(()=>r.update(d)), commit:()=>Promise.all(ops.map(f=>f())) }; },
    waitForPendingWrites: ()=>Promise.resolve(),
    runTransaction: (fn)=>fn({ get:(r)=>r.get(), set:(r,d)=>r.set(d), update:(r,d)=>r.update(d) })
  };
  fsFn.FieldValue = { serverTimestamp:()=>Date.now(), increment:(n)=>n, arrayUnion:(...a)=>a, arrayRemove:()=>[], delete:()=>null };
  const authFn = ()=>auth;
  authFn.GoogleAuthProvider = function(){ this.setCustomParameters=()=>{}; };
  authFn.EmailAuthProvider = { credential:()=>({}) };
  authFn.Auth = { Persistence:{ LOCAL:'local' } };
  window.firebase = { initializeApp:()=>({}), auth:authFn, firestore:fsFn, apps:[] };
})();

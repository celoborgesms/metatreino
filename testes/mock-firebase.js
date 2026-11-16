// Firebase "compat" simulado para testes locais do MetaTreino (sem rede, sem conta real).
// Guarda os documentos em memória + localStorage('__mock_fs') para sobreviver a recarregamentos.
(function(){
  const LS = '__mock_fs';
  let store = {};
  try{ store = JSON.parse(localStorage.getItem(LS) || '{}'); }catch(e){}
  const persist = ()=>{ try{ localStorage.setItem(LS, JSON.stringify(store)); }catch(e){} };
  window.__mockFS = store;
  window.__mockWrites = [];
  const MOCK_USER = Object.assign({ uid:'aluno-teste', email:'aluno.teste@example.com', displayName:'Aluno Teste', emailVerified:true }, window.__MOCK_USER || {});
  // Beta 40: métodos do usuário do Firebase usados pelo app (cadastro por e-mail, função do servidor)
  MOCK_USER.updateProfile = ()=>Promise.resolve(); MOCK_USER.sendEmailVerification = ()=>Promise.resolve(); MOCK_USER.getIdToken = ()=>Promise.resolve('token-de-teste');
  MOCK_USER.providerData = MOCK_USER.providerData || [{ providerId:'password' }];
  // Beta 42: o token (que as regras leem) e o objeto do usuário ficam "velhos" até reload()/getIdToken(true)
  MOCK_USER.__tokenVerified = ('__MOCK_TOKEN_VERIFICADO' in window) ? !!window.__MOCK_TOKEN_VERIFICADO : !!MOCK_USER.emailVerified;
  MOCK_USER.reload = ()=>{ window.__mockReloads = (window.__mockReloads||0)+1; if(window.__MOCK_SERVIDOR_VERIFICOU) MOCK_USER.emailVerified = true; return Promise.resolve(); };
  MOCK_USER.getIdToken = (forcar)=>{ if(forcar){ window.__mockTokenNovo = (window.__mockTokenNovo||0)+1; MOCK_USER.__tokenVerified = !!MOCK_USER.emailVerified; } return Promise.resolve('token-de-teste'); };
  MOCK_USER.getIdTokenResult = ()=>Promise.resolve({ claims:{ email_verified: MOCK_USER.__tokenVerified } });
  MOCK_USER.linkWithCredential = (c)=>{ window.__mockLinks = (window.__mockLinks||[]).concat([c && c.providerId || 'password']); const id = (c && c.providerId) || 'password'; if(!MOCK_USER.providerData.some(p=>p.providerId===id)) MOCK_USER.providerData.push({ providerId:id, email:MOCK_USER.email }); return Promise.resolve({ user:MOCK_USER }); };
  MOCK_USER.linkWithPopup = ()=>{ if(window.__MOCK_GOOGLE_JA_USADO) return Promise.reject({ code:'auth/credential-already-in-use' }); MOCK_USER.providerData.push({ providerId:'google.com', email: window.__MOCK_GOOGLE_EMAIL || MOCK_USER.email }); return Promise.resolve({ user:MOCK_USER }); };
  MOCK_USER.unlink = (id)=>{ MOCK_USER.providerData = MOCK_USER.providerData.filter(p=>p.providerId!==id); return Promise.resolve(MOCK_USER); };
  MOCK_USER.reauthenticateWithPopup = ()=>Promise.resolve({ user:MOCK_USER });
  MOCK_USER.reauthenticateWithCredential = ()=>Promise.resolve({ user:MOCK_USER });
  MOCK_USER.updatePassword = ()=>Promise.resolve();
  const now = Date.now();
  // aluno autorizado por padrão (Beta 40: window.__MOCK_SEM_DOC = conta nova, sem documento de plano)
  // documentos iniciais do teste (ex.: plano do aluno, administradores)
  if(window.__MOCK_DOCS) Object.keys(window.__MOCK_DOCS).forEach(k=>{ if(!(k in store)) store[k] = window.__MOCK_DOCS[k]; });
  if(!window.__MOCK_SEM_DOC && !store['usuariosAutorizados/'+MOCK_USER.email]) store['usuariosAutorizados/'+MOCK_USER.email] = { active:true, expiresAt:null, name:'Aluno Teste' };
  // regra de leitura do plano: e-mail não verificado não lê (como no firestore.rules)
  // Beta 43: __MOCK_NEGA_AUTORIZACAO = a leitura da autorização é recusada mesmo com credencial nova (ex.: regras antigas publicadas)
  const negado = path => /^usuariosAutorizados\//.test(path) && (window.__MOCK_NEGA_AUTORIZACAO || (!MOCK_USER.__tokenVerified && !/@aluno\.metatreino\.app$/.test(MOCK_USER.email)));
  // regra da Beta 42: conta marcada como excluída não grava os próprios dados (o administrador sim)
  const gravacaoNegada = path => /^usuarios\//.test(path) && !!store['contasExcluidas/' + String(MOCK_USER.email).toLowerCase()] && !window.__MOCK_ADMIN_GRAVA;
  // Beta 46: ouvintes de documento (onSnapshot) e a regra da coleção familias (só membros leem)
  const ouvintes = {};
  function avisa(path){ (ouvintes[path]||[]).slice().forEach(cb=>setTimeout(()=>cb(snap(path)), 0)); }
  window.__mockAvisa = avisa;
  function famNegado(path, op, data){
    if(!/^familias\//.test(path) || store[path] === undefined) return false;
    const membro = (store[path].membros||[]).includes(MOCK_USER.uid);
    if(op === 'read') return !membro;
    if(op === 'update' && !membro){ const v = data && data.membros; return !(v && v.__op === 'union' && v.v.length === 1 && v.v[0] === MOCK_USER.uid && (store[path].membros||[]).length < 6); }
    return false;
  }
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
      get: ()=> (negado(path) || famNegado(path, 'read')) ? Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code:'permission-denied' })) : Promise.resolve(snap(path)),
      set: (data, opt)=>{ if(gravacaoNegada(path)) return Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code:'permission-denied' })); try{ validaFirestore(data, path); }catch(e){ return Promise.reject(e); } window.__mockWrites.push({path, at:Date.now(), bytes: JSON.stringify(data).length}); const base = (opt && opt.merge) ? JSON.parse(JSON.stringify(store[path]||{})) : {};
        Object.keys(data).forEach(k=>{ const v = data[k];
          if(v && v.__op === 'del') delete base[k];
          else if(v && v.__op === 'union'){ const a = Array.isArray(base[k]) ? base[k] : []; v.v.forEach(x=>{ if(!a.includes(x)) a.push(x); }); base[k] = a; }
          else if(v && v.__op === 'remove') base[k] = (Array.isArray(base[k]) ? base[k] : []).filter(x=>!v.v.includes(x));
          else base[k] = JSON.parse(JSON.stringify(v)); });
        store[path] = base; persist(); avisa(path); return Promise.resolve(); },
      // Beta 46: update com caminho pontuado ("a.b.c"), arrayUnion/arrayRemove/delete e aviso aos ouvintes
      update: (data)=>{
        if(store[path] === undefined) return Promise.reject(Object.assign(new Error('No document to update'), { code:'not-found' }));
        if(famNegado(path, 'update', data)) return Promise.reject(Object.assign(new Error('Missing or insufficient permissions.'), { code:'permission-denied' }));
        const doc = JSON.parse(JSON.stringify(store[path]));
        Object.keys(data).forEach(k=>{
          const partes = k.split('.'); let o = doc; for(let i=0;i<partes.length-1;i++){ if(!o[partes[i]] || typeof o[partes[i]] !== 'object') o[partes[i]] = {}; o = o[partes[i]]; }
          const ult = partes[partes.length-1], v = data[k];
          if(v && v.__op === 'union'){ const a = Array.isArray(o[ult]) ? o[ult] : []; v.v.forEach(x=>{ if(!a.includes(x)) a.push(x); }); o[ult] = a; }
          else if(v && v.__op === 'remove'){ o[ult] = (Array.isArray(o[ult]) ? o[ult] : []).filter(x=>!v.v.includes(x)); }
          else if(v && v.__op === 'del'){ delete o[ult]; }
          else o[ult] = JSON.parse(JSON.stringify(v));
        });
        store[path] = doc; persist(); avisa(path); return Promise.resolve();
      },
      delete: ()=>{ delete store[path]; persist(); avisa(path); return Promise.resolve(); },
      collection: (c)=>colRef(path+'/'+c),
      onSnapshot: (cb, erro)=>{ (ouvintes[path] = ouvintes[path] || []).push(cb); setTimeout(()=>{ if(famNegado(path, 'read')){ if(erro) erro(Object.assign(new Error('Missing or insufficient permissions.'), { code:'permission-denied' })); return; } cb(snap(path)); }, 0); return ()=>{ ouvintes[path] = (ouvintes[path]||[]).filter(f=>f!==cb); }; }
    };
  }
  function colRef(path, filtros){
    filtros = filtros || [];
    const passa = k=>filtros.every(([c, op, v])=>{ const d = store[k] || {}; return op === '==' ? d[c] === v : op === '>' ? (d[c] !== undefined && d[c] !== null && d[c] > v) : true; });
    const q = {
      doc: (id)=>docRef(path+'/'+(id || ('auto'+Math.random().toString(36).slice(2,10)))),
      add: (data)=>{ const id='auto'+Math.random().toString(36).slice(2,10); store[path+'/'+id]=JSON.parse(JSON.stringify(data)); persist(); return Promise.resolve(docRef(path+'/'+id)); },
      where: (c, op, v)=>colRef(path, filtros.concat([[c, op, v]])), orderBy: ()=>q, limit: ()=>q, startAfter: ()=>q,
      get: ()=>{ const pre = path+'/'; const docs = Object.keys(store).filter(k=>k.startsWith(pre) && !k.slice(pre.length).includes('/') && passa(k)).map(k=>snap(k)); return Promise.resolve({ docs, size:docs.length, empty:!docs.length, forEach:(f)=>docs.forEach(f) }); },
      onSnapshot: (cb)=>{ setTimeout(()=>q.get().then(cb), 0); return ()=>{}; }
    };
    return q;
  }
  const authListeners = [];
  const auth = {
    currentUser: null,
    onAuthStateChanged(cb){ authListeners.push(cb); setTimeout(()=>{ auth.currentUser = window.__MOCK_LOGGED_OUT ? null : MOCK_USER; cb(auth.currentUser); }, 30); return ()=>{}; },
    signOut(){ auth.currentUser = null; authListeners.forEach(f=>f(null)); return Promise.resolve(); },
    signInWithPopup(){ if(window.__MOCK_GOOGLE_CONFLITO){ window.__MOCK_GOOGLE_CONFLITO = false; return Promise.reject({ code:'auth/account-exists-with-different-credential', email: MOCK_USER.email, credential:{ providerId:'google.com' } }); } return Promise.resolve({ user: MOCK_USER }); },
    signInWithEmailAndPassword(em, pass){ if(window.__MOCK_SENHA && pass !== window.__MOCK_SENHA) return Promise.reject({ code:'auth/invalid-credential' }); if(!auth.currentUser){ auth.currentUser = MOCK_USER; authListeners.forEach(f=>setTimeout(()=>f(MOCK_USER), 0)); } return Promise.resolve({ user: MOCK_USER }); },
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
  fsFn.FieldValue = { serverTimestamp:()=>Date.now(), increment:(n)=>n, arrayUnion:(...a)=>({__op:'union', v:a}), arrayRemove:(...a)=>({__op:'remove', v:a}), delete:()=>({__op:'del'}) };
  const authFn = ()=>auth;
  authFn.GoogleAuthProvider = function(){ this.setCustomParameters=()=>{}; };
  authFn.EmailAuthProvider = { credential:()=>({}) };
  authFn.Auth = { Persistence:{ LOCAL:'local' } };
  window.firebase = { initializeApp:()=>({}), auth:authFn, firestore:fsFn, apps:[] };
})();

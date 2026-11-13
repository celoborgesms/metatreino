// Firebase "compat" simulado que conversa com testes/nuvem-simulada.py: vários navegadores (celular e
// computador) compartilham a MESMA nuvem, com as regras da Beta 34 simuladas. Usado por testes/dois-aparelhos.py.
// window.__MOCK_USER define quem está logado (uid, email, emailVerified, providerData).
// window.__mockOffline = true simula falta de internet: leituras falham e gravações ficam na fila.
(function(){
  const U = window.__MOCK_USER || { uid:'u1', email:'aluno@example.com', emailVerified:true, providerData:[{providerId:'google.com'}] };
  const token = ()=>({ uid: auth.currentUser && auth.currentUser.uid, email: auth.currentUser && auth.currentUser.email, verified: !!(auth.currentUser && auth.currentUser.emailVerified) });
  const fila = [];
  const offline = ()=> window.__mockOffline === true;
  async function chama(corpo){
    const r = await fetch('/__fs/' + corpo.op, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(Object.assign({ token: token() }, corpo)) });
    const j = await r.json();
    if(r.status === 403){ const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; }
    return j;
  }
  function erroRede(){ const e = new Error('Failed to get document because the client is offline.'); e.code = 'unavailable'; return e; }
  const DEL = { __apagar:true };
  function limpa(v){ return JSON.parse(JSON.stringify(v, (k, x)=> (x && x.__del === true) ? DEL : x)); }
  function snap(caminho, j){ const d = j && j.dados; return { exists: !!(j && j.existe), id: caminho.split('/').pop(), data: ()=> d ? JSON.parse(JSON.stringify(d)) : undefined, ref:{ path:caminho }, metadata:{ hasPendingWrites:false, fromCache:false } }; }
  async function grava(op, caminho, dados, merge){
    const tarefa = ()=>chama({ op, caminho, dados: dados ? limpa(dados) : undefined, merge: !!merge });
    if(offline()){ return new Promise((res, rej)=>fila.push({ tarefa, res, rej })); }   // como o Firestore: confirma quando a internet volta
    return tarefa();
  }
  window.__mockReenviar = async function(){ while(fila.length && !offline()){ const f = fila.shift(); try{ f.res(await f.tarefa()); }catch(e){ f.rej(e); } } };
  window.addEventListener('online', ()=>{ window.__mockOffline = false; window.__mockReenviar(); });
  function docRef(caminho){
    const ref = {
      id: caminho.split('/').pop(), path: caminho,
      get: async ()=>{ if(offline()) throw erroRede(); return snap(caminho, await chama({ op:'get', caminho })); },
      set: (d, o)=>grava('set', caminho, d, o && o.merge),
      update: (d)=>grava('set', caminho, d, true),
      delete: ()=>grava('delete', caminho),
      collection: (c)=>colRef(caminho + '/' + c),
      onSnapshot: (cb, erro)=>{
        let ultima = null, vivo = true;
        const roda = async ()=>{ if(!vivo) return; try{ if(!offline()){ const j = await chama({ op:'get', caminho }); const k = JSON.stringify(j.dados || null); if(k !== ultima){ ultima = k; cb(snap(caminho, j)); } } }catch(e){ if(erro) erro(e); vivo = false; return; } setTimeout(roda, 700); };
        roda(); return ()=>{ vivo = false; };
      }
    };
    return ref;
  }
  function colRef(caminho, filtro){
    const q = {
      doc: (id)=>docRef(caminho + '/' + (id || ('auto' + Math.random().toString(36).slice(2, 10)))),
      add: async (d)=>{ const id = 'auto' + Math.random().toString(36).slice(2, 10); await grava('set', caminho + '/' + id, d); return docRef(caminho + '/' + id); },
      where: (campo, op, valor)=>colRef(caminho, [campo, op, valor]), orderBy: ()=>q, limit: ()=>q, startAfter: ()=>q,
      get: async ()=>{ if(offline()) throw erroRede(); const j = await chama({ op:'list', caminho, filtro }); const docs = j.docs.map(d=>snap(caminho + '/' + d.id, { existe:true, dados:d.dados })); return { docs, size:docs.length, empty:!docs.length, forEach:(f)=>docs.forEach(f) }; },
      onSnapshot: (cb)=>{ q.get().then(cb).catch(()=>{}); return ()=>{}; }
    };
    return q;
  }
  const ouvintes = [];
  const auth = {
    currentUser: null,
    onAuthStateChanged(cb){ ouvintes.push(cb); setTimeout(()=>{ auth.currentUser = window.__MOCK_LOGGED_OUT ? null : U; cb(auth.currentUser); }, 30); return ()=>{}; },
    signOut(){ auth.currentUser = null; ouvintes.forEach(f=>f(null)); return Promise.resolve(); },
    signInWithPopup(){ return Promise.resolve({ user:U }); }, signInWithEmailAndPassword(){ return Promise.resolve({ user:U }); },
    createUserWithEmailAndPassword(){ return Promise.resolve({ user:U }); }, sendPasswordResetEmail(){ return Promise.resolve(); }, setPersistence(){ return Promise.resolve(); }
  };
  const fs = { collection: c=>colRef(c), doc: docRef, enablePersistence: ()=>Promise.resolve(), waitForPendingWrites: ()=>Promise.resolve(),
    batch: ()=>{ const ops = []; return { set:(r,d,o)=>ops.push(()=>r.set(d,o)), update:(r,d)=>ops.push(()=>r.update(d)), delete:(r)=>ops.push(()=>r.delete()), commit:()=>Promise.all(ops.map(f=>f())) }; } };
  const fsFn = ()=>fs; fsFn.FieldValue = { delete:()=>({ __del:true }), serverTimestamp:()=>Date.now(), increment:(n)=>n, arrayUnion:(...a)=>a, arrayRemove:()=>[] };
  const authFn = ()=>auth; authFn.GoogleAuthProvider = function(){ this.setCustomParameters = ()=>{}; }; authFn.EmailAuthProvider = { credential:()=>({}) }; authFn.Auth = { Persistence:{ LOCAL:'local' } };
  window.firebase = { initializeApp:()=>({}), auth:authFn, firestore:fsFn, apps:[] };
})();

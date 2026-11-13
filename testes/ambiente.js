// Ambiente mínimo para rodar app.js + app-plus.js no Node, sem navegador e sem conta real.
// Uso: const amb = require('./ambiente'); const app = amb.carregar(); app.generatePlan(...)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RAIZ = path.join(__dirname, '..');

function elFalso(){
  const el = { style:{}, dataset:{}, children:[], childNodes:[], classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){}, appendChild(c){ return c; }, removeChild(){}, remove(){}, insertBefore(c){ return c; },
    addEventListener(){}, removeEventListener(){}, querySelector(){ return null; }, querySelectorAll(){ return []; }, getBoundingClientRect(){ return {top:0,left:0,width:0,height:0,bottom:0,right:0}; },
    focus(){}, click(){}, closest(){ return null; }, contains(){ return false; }, scrollTo(){}, scrollIntoView(){}, getContext(){ return null; },
    innerHTML:'', textContent:'', value:'', offsetWidth:0, offsetHeight:0, scrollTop:0, scrollHeight:0, clientHeight:0 };
  return el;
}
function carregar(opcoes){
  opcoes = opcoes || {};
  const mem = {};
  const localStorage = { getItem:k=>Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null, setItem:(k,v)=>{ mem[k]=String(v); }, removeItem:k=>{ delete mem[k]; }, clear:()=>{ Object.keys(mem).forEach(k=>delete mem[k]); }, key:i=>Object.keys(mem)[i]||null, get length(){ return Object.keys(mem).length; } };
  const ouvintes = {};
  const document = {
    readyState:'complete', visibilityState:'visible', hidden:false, body: elFalso(), head: elFalso(), documentElement: elFalso(), activeElement:null,
    addEventListener(t,f){ (ouvintes['doc:'+t] = ouvintes['doc:'+t] || []).push(f); }, removeEventListener(t,f){ const l = ouvintes['doc:'+t]||[]; const i=l.indexOf(f); if(i>=0) l.splice(i,1); }, dispatchEvent(e){ (ouvintes['doc:'+e.type]||[]).slice().forEach(f=>f(e)); },
    getElementById(){ return null; }, querySelector(){ return null; }, querySelectorAll(){ return []; }, createElement(){ return elFalso(); }, createElementNS(){ return elFalso(); }, createTextNode(){ return elFalso(); },
    fonts:{ ready: Promise.resolve() }
  };
  const ctx = {
    console: opcoes.silencioso === false ? console : { log(){}, warn(){}, error(){}, info(){} },
    document, localStorage, sessionStorage: localStorage,
    navigator: { userAgent:'node', onLine:true, language:'pt-BR', vibrate(){ return true; }, maxTouchPoints:0 },
    location: { href:'http://localhost/', origin:'http://localhost', pathname:'/', search:'', hash:'', reload(){} },
    history: { pushState(){}, replaceState(){}, back(){}, state:null },
    matchMedia: ()=>({ matches:false, addEventListener(){}, addListener(){} }),
    setTimeout: (f, ms)=>{ return 0; }, clearTimeout(){}, setInterval: ()=>0, clearInterval(){},   // timers desligados: os testes chamam as funções direto
    requestAnimationFrame: ()=>0, cancelAnimationFrame(){},
    Event: function(t){ this.type = t; }, CustomEvent: function(t,o){ this.type = t; this.detail = o && o.detail; },
    fetch: ()=>Promise.reject(new Error('sem rede nos testes')),
    Image: function(){}, Blob: function(){}, URL: { createObjectURL(){ return ''; }, revokeObjectURL(){} },
    indexedDB: undefined, caches: undefined, IntersectionObserver: function(){ this.observe=()=>{}; this.disconnect=()=>{}; }, ResizeObserver: function(){ this.observe=()=>{}; this.disconnect=()=>{}; }, MutationObserver: function(){ this.observe=()=>{}; this.disconnect=()=>{}; },
    performance: { now: ()=>Date.now() }, innerWidth: 390, innerHeight: 844, devicePixelRatio: 2, screen:{ width:390, height:844 },
    addEventListener(t,f){ (ouvintes['win:'+t] = ouvintes['win:'+t] || []).push(f); }, removeEventListener(){}, dispatchEvent(e){ (ouvintes['win:'+e.type]||[]).slice().forEach(f=>f(e)); },
    scrollTo(){}, getComputedStyle: ()=>({ getPropertyValue: ()=>'' }), alert(){}, confirm(){ return true; },
    __ouvintes: ouvintes
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  ctx.__MOCK_LOGGED_OUT = true;   // não dispara o login sozinho
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'mock-firebase.js'), 'utf8'), ctx, { filename:'mock-firebase.js' });
  for(const f of ['app.js', 'app-plus.js']) vm.runInContext(fs.readFileSync(path.join(RAIZ, f), 'utf8'), ctx, { filename:f });
  // let/const do app.js não viram propriedades do contexto: expõe o que os testes usam
  vm.runInContext(`globalThis.__get = (n)=>eval(n); globalThis.__set = (n,v)=>eval(n+'=v');`, ctx);
  ctx.Date = vm.runInContext('Date', ctx);   // o Date de dentro do app (os testes podem adiantar o relógio)
  ctx.estado = ()=>ctx.__get('state');
  ctx.trocarEstado = (s)=>ctx.__set('state', s);
  return ctx;
}
module.exports = { carregar, RAIZ };

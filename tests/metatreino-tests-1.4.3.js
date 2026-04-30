// Testes estáticos da lógica 1.4.3: dor específica e classificação por divisão.
function n(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();}
function tem(txt,arr){txt=n(txt);return arr.some(t=>txt.indexOf(n(t))>=0);}
function tipoNome(nome){const x=n(nome); if(tem(x,['supino','flexao','crucifixo','triceps','desenvolvimento']))return 'A'; if(tem(x,['face pull','puxada','remada','rosca','biceps']))return 'B'; if(tem(x,['agach','leg press','afundo','stiff','panturrilha','gluteo','abdominal','prancha']))return 'C'; if(tem(x,['caminhada','corrida','bicicleta','esteira']))return 'cardio'; return 'descanso';}
function tipoBloqueado(t,ds){const d=ds.map(n).filter(x=>x&&x!=='nenhuma'); if(t==='C'&&d.some(x=>['pernas','joelho','lombar','coluna'].includes(x)))return true; if(t==='A'&&d.some(x=>['bracos','ombro'].includes(x)))return true; if(t==='B'&&d.some(x=>['bracos','ombro','lombar','coluna'].includes(x)))return true; return false;}
function assert(cond,msg){if(!cond){throw new Error(msg)}}
assert(tipoNome('Crucifixo no chão')==='A','Crucifixo precisa ser empurrar');
assert(tipoNome('Remada baixa')==='B','Remada precisa ser puxar');
assert(tipoNome('Agachamento')==='C','Agachamento precisa ser inferior');
assert(tipoBloqueado('C',['pernas']),'Dor nas pernas deve bloquear inferiores');
assert(!tipoBloqueado('A',['pernas']),'Dor nas pernas nao deve bloquear empurrar');
assert(tipoBloqueado('A',['ombro']),'Dor no ombro deve bloquear empurrar');
assert(tipoBloqueado('B',['lombar']),'Dor lombar deve bloquear puxar');
assert(tipoNome('Caminhada leve')==='cardio','Caminhada nao deve entrar como forca/recuperacao principal');
console.log('Testes 1.4.3 OK');

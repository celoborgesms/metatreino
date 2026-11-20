// Gera arquivos FIT de teste com o SDK oficial (Garmin), só para os testes do MetaTreino.
import { Encoder, Profile } from '@garmin/fitsdk';
import fs from 'fs';
const M = Profile.MesgNum;
const semi = deg => Math.round(deg * (2**31 / 180));
function atividade(nome, { sport, subSport, km, min, hr = true, cad = true, alt = true, gps = true, inicio, sets }){
  const enc = new Encoder();
  const t0 = new Date(inicio);
  enc.onMesg(M.FILE_ID, { type:'activity', manufacturer:'garmin', product:3990, timeCreated:t0, serialNumber:1234567 });
  enc.onMesg(M.DEVICE_INFO, { timestamp:t0, manufacturer:'garmin', product:3990, serialNumber:1234567, deviceIndex:'creator' });
  enc.onMesg(M.EVENT, { timestamp:t0, event:'timer', eventType:'start' });
  const n = Math.round(min * 60 / 5);            // um ponto a cada 5 s
  let lat = -12.55, lon = -55.71, dist = 0;
  const v = km * 1000 / (min * 60);
  for(let i = 0; i <= n && km > 0; i++){
    const ts = new Date(t0.getTime() + i * 5000);
    const vv = v * (1 + 0.08 * Math.sin(i / 9));
    if(i) dist += vv * 5;
    lat += (vv * 5 / 111000) * 0.7; lon += (vv * 5 / 111000) * 0.7;
    const r = { timestamp:ts, distance:dist, speed:vv };
    if(gps) Object.assign(r, { positionLat:semi(lat), positionLong:semi(lon) });
    if(alt) r.altitude = 380 + 12 * Math.sin(i / 25);
    if(hr) r.heartRate = Math.round(130 + 20 * Math.min(1, i / 80) + 5 * Math.sin(i / 7));
    if(cad) r.cadence = sport === 'cycling' ? 85 : 82;
    enc.writeMesg({ mesgNum:M.RECORD, ...r });
  }
  let tFim = new Date(t0.getTime() + min * 60000);
  if(sets){
    let t = t0.getTime();
    sets.forEach((s, i)=>{
      enc.writeMesg({ mesgNum:M.SET, messageIndex:i, startTime:new Date(t), timestamp:new Date(t + (s.dur||40)*1000), duration:s.dur || 40, setType: s.rest ? 'rest' : 'active',
        ...(s.rest ? {} : { repetitions:s.reps, weight:s.kg, category:[s.cat], categorySubtype:[s.sub] }) });
      t += (s.dur || 40) * 1000;
      if(hr) enc.writeMesg({ mesgNum:M.RECORD, timestamp:new Date(t), heartRate: s.rest ? 110 : 135 });
    });
    tFim = new Date(t);
  }
  enc.onMesg(M.EVENT, { timestamp:tFim, event:'timer', eventType:'stopAll' });
  const sess = { timestamp:tFim, startTime:t0, totalElapsedTime:(tFim - t0)/1000, totalTimerTime:(tFim - t0)/1000 * 0.97, sport, subSport, totalDistance:km*1000, totalCalories: Math.round(min*9), firstLapIndex:0, numLaps:1, messageIndex:0 };
  if(hr){ sess.avgHeartRate = 145; sess.maxHeartRate = 168; }
  if(km){ sess.avgSpeed = v; sess.enhancedAvgSpeed = v; sess.maxSpeed = v*1.15; sess.enhancedMaxSpeed = v*1.15; }
  if(alt) sess.totalAscent = 42;
  enc.onMesg(M.LAP, { ...sess, messageIndex:0 });
  enc.onMesg(M.SESSION, sess);
  enc.onMesg(M.ACTIVITY, { timestamp:tFim, totalTimerTime:(tFim - t0)/1000, numSessions:1, type:'manual', event:'activity', eventType:'stop' });
  fs.writeFileSync(nome, enc.close());
  console.log('ok', nome);
}
const d = '/home/claude/fitbuild/amostras/'; fs.mkdirSync(d, { recursive:true });
atividade(d+'corrida.fit', { sport:'running', subSport:'generic', km:8.2, min:46, inicio:'2026-11-17T06:10:00-04:00' });
atividade(d+'corrida-sem-fc.fit', { sport:'running', subSport:'generic', km:5.0, min:27, hr:false, cad:false, inicio:'2026-11-16T06:00:00-04:00' });
atividade(d+'bike.fit', { sport:'cycling', subSport:'road', km:32.5, min:70, inicio:'2026-11-15T07:00:00-04:00' });
atividade(d+'caminhada.fit', { sport:'walking', subSport:'generic', km:3.61, min:36, inicio:'2026-11-14T19:34:00-04:00' });
const C = Profile.types.exerciseCategory;
const cat = nome => Number(Object.keys(C).find(k=>C[k] === nome));
atividade(d+'musculacao.fit', { sport:'training', subSport:'strengthTraining', km:0, min:0, gps:false, alt:false, cad:false, inicio:'2026-11-18T18:00:00-04:00', sets:[
  { cat:cat('benchPress'), sub:1, reps:10, kg:20, dur:35 }, { rest:true, dur:90 },
  { cat:cat('benchPress'), sub:1, reps:10, kg:40, dur:40 }, { rest:true, dur:90 },
  { cat:cat('benchPress'), sub:1, reps:10, kg:40, dur:40 }, { rest:true, dur:90 },
  { cat:cat('benchPress'), sub:1, reps:9, kg:40, dur:40 }, { rest:true, dur:90 },
  { cat:cat('curl'), sub:3, reps:12, kg:15, dur:35 }, { rest:true, dur:60 },
  { cat:cat('curl'), sub:3, reps:12, kg:15, dur:35 }, { rest:true, dur:60 },
  { cat:cat('curl'), sub:3, reps:11, kg:15, dur:35 }, { rest:true, dur:60 },
  { cat:cat('tricepsExtension'), sub:0, reps:12, kg:25, dur:35 }, { rest:true, dur:60 },
  { cat:cat('tricepsExtension'), sub:0, reps:12, kg:25, dur:35 }, { rest:true, dur:60 },
  { cat:cat('tricepsExtension'), sub:0, reps:12, kg:25, dur:35 }
]});
atividade(d+'musculacao-so-fc.fit', { sport:'training', subSport:'strengthTraining', km:0, min:50, gps:false, alt:false, cad:false, inicio:'2026-11-12T18:00:00-04:00' });

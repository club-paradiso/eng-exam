(() => {
  const APP_STORAGE_KEYS = ['english-map-mvp-v2', 'english-map-mvp-v1'];
  const TELEMETRY_KEY = 'english-map-calibration-v1';

  function id() {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function loadTelemetry() {
    try { return JSON.parse(localStorage.getItem(TELEMETRY_KEY)); } catch { return null; }
  }
  function freshTelemetry() {
    return { schemaVersion:'english-map-calibration.v1', attemptId:id(), startedAt:null, completedAt:null, activeId:null, activeSince:null, firstSeenAt:{}, exposureMs:{}, answerChanges:{}, lastChoice:{}, events:[] };
  }
  let t = loadTelemetry() || freshTelemetry();
  function save(){ try { localStorage.setItem(TELEMETRY_KEY, JSON.stringify(t)); } catch {} }
  function appState(){
    for (const key of APP_STORAGE_KEYS) {
      try { const v=JSON.parse(localStorage.getItem(key)); if(v) return v; } catch {}
    }
    return {};
  }
  function finalize(now=Date.now()){
    if(t.activeId && t.activeSince){
      t.exposureMs[t.activeId]=(t.exposureMs[t.activeId]||0)+Math.max(0,now-t.activeSince);
    }
    t.activeId=null; t.activeSince=null;
  }
  function activate(itemId){
    if(!itemId || t.activeId===itemId) return;
    finalize();
    t.activeId=itemId; t.activeSince=Date.now();
    if(!t.firstSeenAt[itemId]) t.firstSeenAt[itemId]=new Date().toISOString();
    save();
  }
  function currentItemId(){
    const qid=document.querySelector('.qid')?.textContent?.trim();
    return qid ? qid.split('·')[0].trim() : null;
  }
  function markStarted(){
    if(!t.startedAt) t.startedAt=new Date().toISOString();
    save();
  }
  function correctFor(item, answer){
    if(answer===undefined || answer==='') return null;
    if(item.format==='mcq') return Number(answer)===item.answer;
    const a=String(answer).trim().toLowerCase();
    if(item.id==='V07') return /\bbecause\b/.test(a) && a.split(/\s+/).length>=4;
    return a===String(item.answer_guide||'').trim().toLowerCase();
  }
  function buildPayload(){
    finalize();
    if(!t.completedAt) t.completedAt=new Date().toISOString();
    const s=appState();
    const D=window.DIAG_DATA||{};
    const items=[...(D.objectiveItems||[]),...(D.foundation||[]),...(D.ceiling||[])];
    const responses=items.filter(x=>s.answers?.[x.id]!==undefined).map(x=>({
      itemId:x.id, section:x.section, skill:x.skill||null, cefr:x.cefr||null, kr2022:x.kr2022||[],
      answer:s.answers[x.id], correct:correctFor(x,s.answers[x.id]),
      responseTimeMs:Math.round(t.exposureMs[x.id]||0), answerChanges:t.answerChanges[x.id]||0,
      replayCount:s.replays?.[x.id]||0, firstSeenAt:t.firstSeenAt[x.id]||null
    }));
    const performance=(D.performanceTasks||[]).map(x=>({
      taskId:x.id, section:x.section, cefr:x.cefr||null, kr2022:x.kr2022||[],
      rubrics:s.rubrics?.[x.id]||{}, response:s.taskResponses?.[x.id]||'',
      responseTimeMs:Math.round(t.exposureMs[x.id]||0), firstSeenAt:t.firstSeenAt[x.id]||null
    }));
    const started=t.startedAt?Date.parse(t.startedAt):null, completed=Date.parse(t.completedAt);
    return {
      schemaVersion:'english-map-attempt.v1', attemptId:t.attemptId, engineVersion:D.meta?.version||null,
      student:s.student||{}, startedAt:t.startedAt, completedAt:t.completedAt,
      durationMs:started&&completed?Math.max(0,completed-started):null,
      branches:{foundation:Boolean(s.foundationDone),ceiling:Boolean(s.ceilingDone)},
      responses, performance,
      client:{language:navigator.language||null, timezoneOffsetMinutes:new Date().getTimezoneOffset(), viewport:{width:innerWidth,height:innerHeight}}
    };
  }
  function downloadPayload(){
    const payload=buildPayload(); save();
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`english-map-${t.attemptId}.json`; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),0);
  }
  function ensureCalibrationButton(){
    const header=document.querySelector('.result-header .top-actions');
    if(!header || document.getElementById('calibrationExportBtn')) return;
    const b=document.createElement('button'); b.id='calibrationExportBtn'; b.className='ghost'; b.textContent='Calibration JSON';
    b.addEventListener('click',downloadPayload); header.prepend(b);
    if(!t.completedAt) t.completedAt=new Date().toISOString(); save();
  }
  function inspect(){
    const item=currentItemId(); if(item) activate(item);
    ensureCalibrationButton();
  }

  document.addEventListener('click',e=>{
    const start=e.target.closest('#startBtn'); if(start) markStarted();
    const choice=e.target.closest('[data-choice]');
    if(choice){
      const item=currentItemId(); const value=Number(choice.dataset.choice);
      if(item && t.lastChoice[item]!==undefined && t.lastChoice[item]!==value) t.answerChanges[item]=(t.answerChanges[item]||0)+1;
      if(item) t.lastChoice[item]=value;
      save();
    }
    if(e.target.closest('[data-action="reset"]')){ localStorage.removeItem(TELEMETRY_KEY); t=freshTelemetry(); save(); }
  },true);

  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){ finalize(); save(); }
    else inspect();
  });
  window.addEventListener('beforeunload',()=>{ finalize(); save(); });

  const observer=new MutationObserver(inspect);
  observer.observe(document.documentElement,{subtree:true,childList:true});
  inspect();
})();

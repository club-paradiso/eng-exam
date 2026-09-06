(() => {
const D = window.DIAG_DATA;
const STORAGE = 'english-map-mvp-v1';
const sections = {vocabulary:'Vocabulary',listening:'Listening',reading:'Reading',grammar_form:'Grammar / Form',speaking:'Speaking',writing:'Writing',foundation:'Foundation',ceiling:'Ceiling'};
const grammarPartMap = {G09:1,G10:1,G11:2,G12:2,G01:3,G17:3,G18:3,G02:4,G03:4,G04:4,G05:4,G13:5,G14:5,G15:6,G16:6,G06:7,G07:7};
const partNames = {1:'명사',2:'대명사',3:'be동사',4:'일반동사',5:'조동사',6:'형용사/부사',7:'전치사/접속사'};
const rubricHelp = '0 수행 불가 · 1 단어/암기표현 중심 · 2 간단한 문장으로 의미 전달 · 3 독립적으로 과제 충족';
let state = load() || {screen:'start',student:{name:'',grade:'5'},answers:{},replays:{},rubrics:{},taskResponses:{},index:0,queue:[],foundationDone:false,ceilingDone:false};

function save(){ try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){} }
function load(){ try{return JSON.parse(localStorage.getItem(STORAGE))}catch(e){return null} }
function esc(s=''){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}
function pct(n,d){ return d?Math.round(n/d*100):0; }
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function status(rate){ if(rate>=.75)return ['Secure','secure']; if(rate>=.5)return ['Developing','developing']; if(rate>0)return ['Emerging','emerging']; return ['Insufficient','']; }
function normalizeCefr(s=''){ if(s.includes('B1'))return 'B1'; if(s.includes('A2'))return 'A2'; if(s.includes('A1'))return 'A1'; if(s.includes('Pre-A1'))return 'Pre-A1'; return null; }

function shell(content){return `<div class="shell"><header class="topbar"><div class="brand">English <span>Map</span></div><div class="top-actions">${state.screen!=='start'?'<button class="ghost" data-action="home" data-small-hide>처음으로</button>':''}<button class="ghost danger" data-action="reset">초기화</button></div></header><main class="container">${content}</main></div>`}
function render(){ if(state.screen==='start') return renderStart(); if(state.screen==='test') return renderTest(); if(state.screen==='performance') return renderPerformance(); if(state.screen==='results') return renderResults(); }
function mount(html){document.getElementById('app').innerHTML=shell(html);bindCommon();}
function bindCommon(){document.querySelector('[data-action="reset"]')?.addEventListener('click',()=>{if(confirm('응시 기록을 모두 초기화할까요?')){localStorage.removeItem(STORAGE);state={screen:'start',student:{name:'',grade:'5'},answers:{},replays:{},rubrics:{},taskResponses:{},index:0,queue:[],foundationDone:false,ceilingDone:false};render();}});document.querySelector('[data-action="home"]')?.addEventListener('click',()=>{state.screen='start';save();render();});}

function renderStart(){
 const done = Object.keys(state.answers||{}).length;
 mount(`<section class="hero"><div><h1>영어 실력을<br>한 줄 점수가 아니라<br>지도처럼 본다.</h1><p>KR2022 교육과정과 CEFR 수행 증거를 함께 보고, 어휘·문법·독해·말하기·쓰기의 강약을 분리해 진단합니다. 시험이 학생의 인내심 측정기로 변질되는 전통은 여기서 끊습니다.</p></div><div class="hero-panel"><h2 style="margin:0 0 6px">진단 시작</h2><p class="muted small">초등 5학년 파일럿 · Core 40문항 + 수행 5과제</p><div class="field"><label>학생 이름</label><input id="studentName" value="${esc(state.student.name||'')}" placeholder="예: 민준"></div><div class="field"><label>학년</label><input id="studentGrade" value="${esc(state.student.grade||'5')}" inputmode="numeric"></div><button class="primary" id="startBtn" style="width:100%;margin-top:8px">${done?'이어하기':'테스트 시작'}</button>${done?`<p class="tagline">저장된 응답 ${done}개가 있습니다.</p>`:''}<div class="notice">이 MVP의 CEFR 표시는 공인 등급 판정이 아니라 영역별 수행 증거 추정입니다.</div></div></section>`);
 document.getElementById('startBtn').onclick=()=>{state.student.name=document.getElementById('studentName').value.trim()||'학생';state.student.grade=document.getElementById('studentGrade').value.trim()||'5'; if(!state.queue.length)state.queue=[...D.objectiveItems.map(x=>x.id)]; state.screen='test';save();render();};
}
function itemById(id){return [...D.objectiveItems,...D.foundation,...D.ceiling].find(x=>x.id===id)}
function renderTest(){
 if(state.index>=state.queue.length){ return decideBranch(); }
 const id=state.queue[state.index], item=itemById(id); if(!item){state.index++;save();return render();}
 const a=state.answers[id]; const progress=pct(state.index,state.queue.length);
 const listening = item.script || item.section==='listening';
 let body='';
 if(item.format==='mcq') body=`<div class="choices">${item.choices.map((c,i)=>`<button class="choice ${a===i?'selected':''}" data-choice="${i}"><span class="choice-index">${i+1}</span><span>${esc(c)}</span></button>`).join('')}</div>`;
 else body=`<div class="field"><label>답</label><input id="shortAnswer" value="${esc(a??'')}" autocomplete="off"></div>`;
 mount(`<div class="progress-wrap"><div class="progress-meta"><span>${esc(sections[item.section]||item.section)}</span><span>${state.index+1} / ${state.queue.length}</span></div><div class="progress"><div style="width:${progress}%"></div></div></div><article class="question-card"><div class="section-label">${esc(sections[item.section]||item.section)}</div><div class="qid">${item.id} · ${esc(item.cefr||'')} · ${esc((item.kr2022||[]).join(', '))}</div>${listening?`<div class="listen-row"><button class="secondary" id="listenBtn">듣기</button><span class="listen-note">재생 ${state.replays[id]||0}/2</span></div>`:''}<h1 class="question">${esc(item.prompt||item.question||'')}</h1>${item.question&&item.prompt?`<div class="question-sub">${esc(item.question)}</div>`:''}${body}<div class="card-actions"><button class="ghost" id="prevBtn" ${state.index===0?'disabled':''}>이전</button><button class="primary" id="nextBtn">다음</button></div></article><div class="footer-note">응답은 이 기기의 브라우저에 자동 저장됩니다. Listening 재청취는 감점하지 않고 기록만 남깁니다.</div>`);
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{state.answers[id]=Number(b.dataset.choice);save();renderTest();});
 if(item.format!=='mcq'){document.getElementById('shortAnswer').oninput=e=>{state.answers[id]=e.target.value;save();};}
 document.getElementById('prevBtn').onclick=()=>{state.index=Math.max(0,state.index-1);save();render();};
 document.getElementById('nextBtn').onclick=()=>{const val=item.format==='mcq'?state.answers[id]:(document.getElementById('shortAnswer')?.value||''); if(val===undefined||String(val).trim()===''){alert('응답을 입력해 주세요.');return;} state.answers[id]=val; state.index++;save();render();};
 if(listening)document.getElementById('listenBtn').onclick=()=>speak(item);
}
function speak(item){ const id=item.id; const n=state.replays[id]||0; if(n>=2){alert('이 문항은 최대 2회까지 들을 수 있습니다.');return;} if(!('speechSynthesis' in window)){alert('이 브라우저는 음성 재생을 지원하지 않습니다.');return;} const u=new SpeechSynthesisUtterance(item.script||item.prompt);u.lang='en-US';u.rate=.82;window.speechSynthesis.cancel();window.speechSynthesis.speak(u);state.replays[id]=n+1;save();renderTest();}

function objectiveStats(items=D.objectiveItems){
 const answered=items.filter(i=>state.answers[i.id]!==undefined && state.answers[i.id]!=='' );
 const correct=answered.filter(i=>{ if(i.format==='mcq')return state.answers[i.id]===i.answer; const ans=String(state.answers[i.id]||'').trim().toLowerCase(); if(i.id==='V07')return /\bbecause\b/.test(ans) && ans.split(/\s+/).length>=4; return ans===String(i.answer_guide||'').trim().toLowerCase(); });
 return {answered:answered.length,correct:correct.length,rate:answered.length?correct.length/answered.length:0};
}
function sectionStats(sec){return objectiveStats(D.objectiveItems.filter(i=>i.section===sec));}
function decideBranch(){
 const baseCore=D.objectiveItems.filter(i=>!['foundation','ceiling'].includes(i.section));
 const early=['V01','V02','R01','R02','G01','G02'].map(itemById).filter(Boolean); const earlyS=objectiveStats(early);
 const core=objectiveStats(baseCore); const r=sectionStats('reading'), l=sectionStats('listening'), g=sectionStats('grammar_form'), v=sectionStats('vocabulary');
 if(!state.foundationDone && earlyS.answered>=4 && earlyS.rate<=.5){state.queue.push(...D.foundation.map(x=>x.id));state.foundationDone=true;save();return renderTest();}
 if(!state.ceilingDone && core.rate>=.85 && r.rate>=.8 && l.rate>=.8 && g.rate>=.8 && v.rate>=.8){state.queue.push(...D.ceiling.map(x=>x.id));state.ceilingDone=true;save();return renderTest();}
 state.screen='performance';state.taskIndex=state.taskIndex||0;save();renderPerformance();
}

function renderPerformance(){
 const idx=state.taskIndex||0; if(idx>=D.performanceTasks.length){state.screen='results';save();return renderResults();}
 const t=D.performanceTasks[idx], rb=D.rubrics[t.id]||{}; state.rubrics[t.id]=state.rubrics[t.id]||{};
 const isWriting=t.section==='writing';
 mount(`<div class="progress-wrap"><div class="progress-meta"><span>수행과제 · ${sections[t.section]}</span><span>${idx+1} / ${D.performanceTasks.length}</span></div><div class="progress"><div style="width:${pct(idx,D.performanceTasks.length)}%"></div></div></div><article class="question-card" style="max-width:920px"><div class="section-label">교사용 수행 평가</div><div class="qid">${t.id} · ${esc(t.cefr||'')} · ${esc((t.kr2022||[]).join(', '))}</div><div class="task-grid"><div><h1 class="question">${esc(t.prompt)}</h1>${isWriting?`<div class="field"><label>학생 작성 답안</label><textarea id="taskResponse" rows="9" placeholder="학생 답안을 입력하거나 그대로 옮겨 적으세요.">${esc(state.taskResponses[t.id]||'')}</textarea></div>`:`<div class="notice">학생의 말하기를 들은 뒤 오른쪽 루브릭으로 채점하세요. 필요하면 메모를 아래에 남길 수 있습니다.</div><div class="field"><label>교사 메모</label><textarea id="taskResponse" rows="5">${esc(state.taskResponses[t.id]||'')}</textarea></div>`}</div><div class="rubric"><h2 style="margin:0 0 10px">0~3 루브릭</h2>${Object.entries(rb).map(([k,label])=>`<div class="rubric-row"><div class="rubric-head"><span>${esc(label)}</span><span>${state.rubrics[t.id][k]??'–'}</span></div><div class="score-buttons">${[0,1,2,3].map(n=>`<button data-dim="${k}" data-score="${n}" class="${state.rubrics[t.id][k]===n?'active':''}">${n}</button>`).join('')}</div></div>`).join('')}<div class="rubric-help">${rubricHelp}</div></div></div><div class="card-actions"><button class="ghost" id="taskPrev">이전</button><button class="primary" id="taskNext">${idx===D.performanceTasks.length-1?'결과 보기':'다음 과제'}</button></div></article>`);
 document.querySelectorAll('[data-dim]').forEach(b=>b.onclick=()=>{state.rubrics[t.id][b.dataset.dim]=Number(b.dataset.score);save();renderPerformance();});
 document.getElementById('taskResponse').oninput=e=>{state.taskResponses[t.id]=e.target.value;save();};
 document.getElementById('taskPrev').onclick=()=>{if(idx===0){state.screen='test';state.index=Math.max(0,state.queue.length-1)}else state.taskIndex=idx-1;save();render();};
 document.getElementById('taskNext').onclick=()=>{const missing=Object.keys(rb).filter(k=>state.rubrics[t.id][k]===undefined);if(missing.length){alert('모든 루브릭 항목을 채점해 주세요.');return;}state.taskIndex=idx+1;save();render();};
}

function rubricPercent(taskIds, dims=null){let vals=[];taskIds.forEach(id=>{const r=state.rubrics[id]||{};Object.entries(r).forEach(([k,v])=>{if(!dims||dims.includes(k))vals.push(Number(v)/3);});});return vals.length?avg(vals):0;}
function cefrEvidence(section){
 const its=D.objectiveItems.filter(i=>i.section===section&&normalizeCefr(i.cefr)); const levels={};
 its.forEach(i=>{const lv=normalizeCefr(i.cefr);levels[lv]=levels[lv]||{n:0,c:0}; if(state.answers[i.id]!==undefined){levels[lv].n++; if(i.format==='mcq'&&state.answers[i.id]===i.answer)levels[lv].c++;}});
 return Object.entries(levels).map(([lv,x])=>({level:lv,rate:x.n?x.c/x.n:0,n:x.n,...{status:status(x.n?x.c/x.n:0)}}));
}
function grammarParts(){const out={};Object.entries(grammarPartMap).forEach(([id,p])=>{const i=itemById(id);if(!i||state.answers[id]===undefined)return;out[p]=out[p]||{n:0,c:0};out[p].n++;if(state.answers[id]===i.answer)out[p].c++;});return Object.entries(out).map(([p,x])=>({part:Number(p),name:partNames[p],rate:x.n?x.c/x.n:0,n:x.n,c:x.c}));}
function recommendations(metrics){
 const rec=[]; const weak=metrics.parts.filter(p=>p.rate<.75).map(p=>p.name);
 if(metrics.grammar<.60) rec.push({type:'문법',title:'혼공 초등영문법 8품사편',reason:`문법 지식이 ${Math.round(metrics.grammar*100)}%입니다. ${weak.length?'약한 Part('+weak.join(', ')+')만 우선 복습하세요.':'전반적인 기초 확인이 필요합니다.'}`});
 else if(metrics.prodGrammar<.65) rec.push({type:'구문',title:'혼공 초등영문법 기초구문편',reason:'객관식 문법 지식에 비해 말하기·쓰기의 문법 통제가 낮습니다. 문제풀이 반복보다 문장 생성 훈련이 우선입니다.'});
 else rec.push({type:'문법',title:'혼공 8품사편은 Review only',reason:'문법 지식과 산출 통제가 모두 비교적 안정적입니다. 정규 진도 비중을 줄이고 독해·영작·상호작용에 시간을 옮기는 편이 낫습니다.'});
 if(metrics.readA1<.75) rec.push({type:'독해',title:'Bricks Reading 100 Nonfiction Level 1',reason:'A1 읽기 수행 증거가 아직 안정적이지 않습니다. 짧은 비문학 지문에서 세부정보와 중심내용을 다지는 단계가 적절합니다.'});
 else if(metrics.readA2<.75) rec.push({type:'독해',title:'Bricks Reading 100 Nonfiction Level 2~3',reason:'A1은 안정적이지만 A2 수준의 세부정보·추론·탐색은 더 연습할 여지가 있습니다.'});
 else rec.push({type:'독해',title:'Reading Inside Starter 후보',reason:'초5~6 Core 읽기가 안정적입니다. Ceiling 결과가 좋다면 예비중등 독해로 넘어갈 수 있습니다.'});
 if(metrics.writing<.60) rec.push({type:'영작',title:'혼공 초등영문법 쓰기편',reason:'문장 형성과 문법 통제를 함께 끌어올릴 필요가 있습니다. 통제 영작부터 자유도가 조금씩 올라가는 구조가 적합합니다.'});
 else if(metrics.connected<.70) rec.push({type:'영작',title:'바빠 초등 하루 5문장 영어 글쓰기 1',reason:'한 문장 단위보다 여러 문장을 연결하는 연습이 더 필요합니다.'});
 else rec.push({type:'영작',title:'바빠 초등 하루 5문장 영어 글쓰기 2 또는 자유영작',reason:'기초 문장 생성이 안정적이므로 연결된 짧은 글과 기능적 메시지 작성으로 확장합니다.'});
 const vr=sectionStats('vocabulary').rate;
 if(vr<.65) rec.push({type:'어휘',title:'능률VOCA 초등 기본 / Word Master 초등 BASIC',reason:'초등 기초 어휘 인식과 문맥 이해부터 안정화하는 편이 좋습니다.'});
 else if(vr<.85) rec.push({type:'어휘',title:'능률VOCA 초등 필수',reason:'초등 고학년 어휘를 채우면서 철자·회상·예문 훈련을 병행하기 좋은 구간입니다.'});
 else rec.push({type:'어휘',title:'Word Master 초등 COMPLETE 또는 예비중등 Bridge',reason:'초등 Core 어휘가 강합니다. 철자·산출이 약하면 COMPLETE, 모두 안정적이면 중등 기본을 검토합니다.'});
 return rec;
}
function metrics(){
 const g=sectionStats('grammar_form').rate, r=sectionStats('reading').rate, l=sectionStats('listening').rate, v=sectionStats('vocabulary').rate;
 const readEv=cefrEvidence('reading'), listenEv=cefrEvidence('listening');
 const get=(arr,lv)=>arr.find(x=>x.level===lv)?.rate||0;
 const prodGrammar=rubricPercent(['S02','W01','W02'],['grammar_control']);
 const writing=rubricPercent(['W01','W02']);
 const sentence=(state.rubrics.W01?.sentence_formation??0)/3;
 const org=(state.rubrics.W02?.organization??0)/3;
 return {grammar:g,reading:r,listening:l,vocab:v,prodGrammar,writing,connected:avg([sentence,org]),readA1:get(readEv,'A1'),readA2:get(readEv,'A2'),listenA1:get(listenEv,'A1'),listenA2:get(listenEv,'A2'),parts:grammarParts(),readEv,listenEv};
}
function metricRow(label,value){return `<div class="metric"><label>${label}</label><strong>${Math.round(value*100)}%</strong><div class="bar"><i style="width:${Math.round(value*100)}%"></i></div></div>`}
function evidenceRows(arr){return arr.map(x=>{const [txt,cls]=x.status;return `<div class="profile-row"><span>${x.level} <span class="muted small">(${x.n} evidence)</span></span><span class="status ${cls}">${txt}</span></div>`}).join('')||'<p class="muted small">증거 부족</p>'}
function renderResults(){const m=metrics(), rec=recommendations(m);mount(`<div class="result-header"><div><div class="section-label">${esc(state.student.name)} · ${esc(state.student.grade)}학년</div><h1>English Map 결과</h1><p class="muted">총점 하나 대신 영역별 증거와 교재 추천을 봅니다.</p></div><div class="top-actions"><button class="ghost" id="exportBtn">결과 JSON 저장</button><button class="primary" id="printBtn">리포트 인쇄</button></div></div><div class="result-grid"><section class="panel"><h2>Core Skill</h2>${metricRow('Vocabulary',m.vocab)}${metricRow('Listening',m.listening)}${metricRow('Reading',m.reading)}${metricRow('Grammar Knowledge',m.grammar)}${metricRow('Productive Grammar',m.prodGrammar)}${metricRow('Writing',m.writing)}</section><section class="panel"><h2>CEFR Evidence</h2><h3 style="font-size:14px;margin:0 0 4px">Reading</h3>${evidenceRows(m.readEv)}<h3 style="font-size:14px;margin:20px 0 4px">Listening</h3>${evidenceRows(m.listenEv)}<div class="notice">공인 CEFR 등급이 아니라 파일럿 수행 증거입니다. 실제 학생 데이터가 쌓인 뒤 컷과 문항 난이도를 보정해야 합니다.</div></section><section class="panel"><h2>혼공 8품사 Part Map</h2>${m.parts.map(p=>`<div class="profile-row"><span>Part ${p.part} · ${p.name}</span><span class="status ${p.rate>=.75?'secure':p.rate>=.5?'developing':'emerging'}">${p.c}/${p.n}</span></div>`).join('')}<div class="weak-list" style="margin-top:16px">${m.parts.filter(p=>p.rate<.75).map(p=>`<span class="weak-chip">복습: ${p.name}</span>`).join('')||'<span class="weak-chip">큰 약점 없음</span>'}</div></section><section class="panel"><h2>교재·수업 추천</h2>${rec.map(x=>`<div class="rec"><div class="section-label" style="margin-bottom:5px">${x.type}</div><h3>${esc(x.title)}</h3><p>${esc(x.reason)}</p></div>`).join('')}</section></div><div class="notice" style="max-width:none;margin-top:18px">추천은 파일럿 규칙 기반입니다. 첫 실제 응시 후 오답 패턴, 반응시간, Listening 재청취, 수행 루브릭을 함께 보고 문항과 추천 임계값을 수정해야 합니다.</div>`);
 document.getElementById('printBtn').onclick=()=>window.print(); document.getElementById('exportBtn').onclick=()=>{const result={student:state.student,generatedAt:new Date().toISOString(),metrics:m,recommendations:rec,answers:state.answers,rubrics:state.rubrics,replays:state.replays,taskResponses:state.taskResponses,engineVersion:D.meta.version};const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`english-map-${state.student.name||'student'}.json`;a.click();URL.revokeObjectURL(a.href);};}
render();
})();

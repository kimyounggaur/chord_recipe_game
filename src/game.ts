import { makeTriad, midiNote, noteLabel, identify, type Quality } from './music';
import { LESSONS, type Lesson } from './lessons';
export type Mode='tutorial'|'practice'|'order'|'repair';
export type Notes=[number|null,number|null,number|null];
export interface GameState {mode:Mode;lessonId:string;root:string;quality:Quality;notes:Notes;before:Notes;active:number;step:number;hint:number;maxHint:number;attempts:number;explained:boolean;complete:boolean;feedback:string;kind:'info'|'retry'|'success';sequenceHeard:boolean;chordHeard:boolean;audioA:boolean;audioB:boolean;visual:boolean;questionIndex:number;mixedDone:number[];seed:number;history:Notes[];}
export const mixedIds=['L01','L05','L20','L22'];
function mixedLesson(seed:number,index:number):Lesson {
 const safeIndex=Number.isInteger(index)?Math.min(Math.max(index,0),mixedIds.length-1):0;
 const chosen=LESSONS.find(l=>l.id===shuffled(seed)[safeIndex])||LESSONS[0];
 return {...chosen,kind:'build',initial:null,hint:0};
}
function tutorialSlot(step:number):number|undefined {return ({2:0,3:1,4:2,8:1} as Record<number,number>)[step];}
export function lessonFor(s:GameState):Lesson {const l=LESSONS.find(l=>l.id===s.lessonId)||LESSONS[0];return l.kind==='mixed'?mixedLesson(s.seed,s.questionIndex):l;}
export function shuffled(seed:number){return mixedIds.map((x,i)=>({x,v:((seed*(i+3)*9301+49297)%233280)})).sort((a,b)=>a.v-b.v).map(x=>x.x);}
export function target(s:GameState){return makeTriad(s.root,s.quality);}
export function isCorrect(s:GameState){return target(s).every((n,i)=>n.midi===s.notes[i]);}
/** Shared interaction policy: rendering and reducer guards must agree. */
export interface GameActionPolicy {
 editableSlots: number[];
 canInput: boolean;
 canUndo: boolean;
 canSubmit: boolean;
 canAdvance: boolean;
}
export function getActionPolicy(s:GameState):GameActionPolicy {
 let editableSlots:number[]=[];
 const lesson=lessonFor(s);
 if(!s.complete || s.mode==='practice'){
  if(s.mode==='tutorial'){
   const slot=tutorialSlot(s.step);
   if(slot!==undefined)editableSlots=[slot];
  }else if(s.mode==='practice')editableSlots=[0,1,2];
  else if(lesson.kind==='compare')editableSlots=[];
  else if(lesson.kind==='transform')editableSlots=[1];
  else if(s.mode==='repair')editableSlots=[1,2];
  else editableSlots=[0,1,2];
 }
 const reviewReady=s.visual||(s.sequenceHeard&&s.chordHeard);
 const comparisonReady=s.visual||(s.audioA&&s.audioB);
 const canAdvance=s.mode==='tutorial' && (
  [1,6,7,12].includes(s.step) ||
  ([5,9].includes(s.step)&&reviewReady) ||
  (s.step===10&&comparisonReady) ||
  (s.step===11&&s.explained)
 );
 const canSubmit=s.mode!=='tutorial'&&s.mode!=='practice'&&!s.complete&&
  (lesson.kind==='compare'?comparisonReady:s.notes.every(note=>note!==null));
 return {editableSlots,canInput:editableSlots.includes(s.active),canUndo:s.mode!=='tutorial'&&s.history.length>0,canSubmit,canAdvance};
}
export function startGame(mode:Mode,id='L01',step=1,seed=17,index=0):GameState {
 const main=LESSONS.find(l=>l.id===id)||LESSONS[0];
 const safeSeed=Number.isInteger(seed)&&seed>=0?seed:17;
 const safeIndex=Number.isInteger(index)?Math.min(Math.max(index,0),mixedIds.length-1):0;
 const l=main.kind==='mixed'?mixedLesson(safeSeed,safeIndex):main;
 const safeStep=Number.isInteger(step)?Math.min(Math.max(step,1),13):1;
 let notes:Notes=mode==='practice'?[null,null,null]:(l.initial?[...l.initial] as Notes:[null,null,null]);
 if(mode==='tutorial')notes=safeStep<3?[null,null,null]:safeStep===3?[60,null,null]:safeStep===4?[60,64,null]:safeStep<=8?[60,64,67]:[60,63,67];
 return {mode,lessonId:main.id,root:mode==='tutorial'?'C':l.root,quality:mode==='tutorial'&&safeStep<7?'major':mode==='tutorial'?'minor':l.quality,notes,before:l.initial?[...l.initial] as Notes:[60,64,67],active:mode==='tutorial'?(tutorialSlot(safeStep)??1):l.initial?1:0,step:safeStep,hint:l.hint,maxHint:l.hint,attempts:0,explained:false,complete:mode==='tutorial'&&safeStep===13,feedback:'재료를 골라 소리의 레시피를 완성해요.',kind:'info',sequenceHeard:false,chordHeard:false,audioA:false,audioB:false,visual:false,questionIndex:safeIndex,mixedDone:[],seed:safeSeed,history:[]};
}
export type Action={type:'START';state:GameState}|{type:'SELECT';slot:number}|{type:'TRY';midi:number}|{type:'SHIFT';delta:number}|{type:'DELETE'}|{type:'UNDO'}|{type:'RESET'}|{type:'HINT'}|{type:'SUBMIT'}|{type:'NEXT_STEP';expectedStep?:number}|{type:'LISTEN';kind:'sequence'|'chord'|'a'|'b'}|{type:'VISUAL'}|{type:'ANSWER';correct:boolean}|{type:'FEEDBACK';text:string;kind?:GameState['kind']}|{type:'CONFIG';root:string;quality:Quality}|{type:'FILL'}|{type:'SNAPSHOT'};
export function reducer(s:GameState,a:Action):GameState {
if(a.type==='START')return a.state;
if(a.type==='FEEDBACK')return {...s,feedback:a.text,kind:a.kind||'info'};
if(a.type==='SELECT'){
 if(!Number.isInteger(a.slot)||a.slot<0||a.slot>2)return s;
 if(s.mode==='tutorial'){
  const required=tutorialSlot(s.step);
  if(required===undefined)return s;
  if(a.slot!==required)return {...s,feedback:s.step===8?'C와 G는 그대로 두고 가운데 음만 바꿔요.':'지금 안내된 재료 칸부터 완성해요.'};
 }
 if(s.mode!=='tutorial'&&!getActionPolicy(s).editableSlots.includes(a.slot)){
  const l=lessonFor(s);
  return {...s,feedback:s.complete?'이미 완성한 주문이에요. 다시 도전에서 수정할 수 있어요.':l.kind==='transform'?'근음과 맨 위 음은 두고 가운데 음만 바꿔요.':s.mode==='repair'?'이번 주문의 근음은 그대로 유지해요.':'지금은 음을 바꿀 수 없어요.',kind:'info'};
 }
 return {...s,active:a.slot};
}
if(a.type==='TRY'||a.type==='SHIFT'||a.type==='DELETE'){
 if(s.complete&&s.mode!=='practice')return s;
 if(s.mode==='tutorial'&&![2,3,4,8].includes(s.step))return s;
 if(!Number.isInteger(s.active)||s.active<0||s.active>2)return s;
 if(s.mode==='tutorial'&&s.active!==tutorialSlot(s.step))return s;
 const l=lessonFor(s);if(!getActionPolicy(s).canInput)return {...s,feedback:l.kind==='transform'?'근음과 맨 위 음은 두고 가운데 음만 바꿔요.':s.mode==='repair'?'이번 주문의 근음은 그대로 유지해요.':'지금은 음을 바꿀 수 없어요.',kind:'info'};
 const n=a.type==='TRY'?a.midi:a.type==='SHIFT'?(s.notes[s.active]??target(s)[s.active].midi)+a.delta:null;
 if(n!==null&&(!Number.isInteger(n)||n<60||n>83))return {...s,feedback:'C4부터 B5 사이의 건반을 골라 주세요.',kind:'retry'};
 if(s.mode==='tutorial'&&n!==target(s)[s.active].midi){const base=s.active===0?60:(s.notes[s.active-1]??60);const want=target(s)[s.active].midi-base;return {...s,attempts:s.attempts+1,kind:'retry',feedback:s.active===0?'이번 기준음은 C4예요.':`출발 음에서 ${n===null?'?':n-base}반음 이동했어요. 이번에는 위로 ${want}반음이 필요해요.`};}
 const notes=[...s.notes] as Notes;notes[s.active]=n;const step=s.mode==='tutorial'?s.step+1:s.step;
 const nextEmpty=notes.findIndex(n=>n===null);
 const active=s.mode==='tutorial'?(tutorialSlot(step)??1):s.mode!=='practice'&&l.kind==='transform'?1:nextEmpty>=0?nextEmpty:s.active;
 return {...s,notes,active,step,history:[...s.history,s.notes],feedback:s.mode==='tutorial'?'좋아요! 다음 재료를 확인해요.':nextEmpty<0?'세 음이 모였어요. 소리와 간격을 확인해요.':'재료가 놓였어요. 음정과 소리를 확인해요.',kind:'info',explained:false,sequenceHeard:false,chordHeard:false,audioA:false,audioB:false,visual:false};
}
if(a.type==='UNDO'){if(!s.history.length||s.mode==='tutorial')return s;return {...s,notes:s.history[s.history.length-1],history:s.history.slice(0,-1),complete:false,explained:false,sequenceHeard:false,chordHeard:false,audioA:false,audioB:false,visual:false};}
if(a.type==='RESET'){const reset=s.mode==='tutorial'?startGame('tutorial'):{...startGame(s.mode,s.lessonId,1,s.seed,s.questionIndex),root:s.root,quality:s.quality};return {...reset,hint:s.hint,maxHint:Math.max(reset.maxHint,s.maxHint),attempts:s.attempts};}
if(a.type==='HINT')return {...s,hint:Math.min(s.hint+1,3),maxHint:Math.max(s.maxHint,Math.min(s.hint+1,3))};
if(a.type==='LISTEN')return {...s,sequenceHeard:s.sequenceHeard||a.kind==='sequence',chordHeard:s.chordHeard||a.kind==='chord',audioA:s.audioA||a.kind==='a',audioB:s.audioB||a.kind==='b'};
if(a.type==='VISUAL')return {...s,visual:true,feedback:'구성음과 두 간격을 그림으로 비교했어요.',kind:'success'};
if(a.type==='ANSWER')return {...s,explained:s.explained||a.correct,feedback:a.correct?'맞아요! 음 사이의 관계를 잘 찾았어요.':'간격 표시를 다시 살펴보세요. 다시 풀어도 좋아요.',kind:a.correct?'success':'retry'};
if(a.type==='NEXT_STEP'){
 if(a.expectedStep!==undefined&&a.expectedStep!==s.step)return s;
 if(s.mode!=='tutorial'||![1,5,6,7,9,10,11,12].includes(s.step))return s;
 if((s.step===5||s.step===9)&&!(s.sequenceHeard&&s.chordHeard)&&!s.visual)return {...s,feedback:'차례로 듣기와 함께 듣기를 완료하거나 그림으로 확인해요.',kind:'retry'};
 if(s.step===10&&!(s.audioA&&s.audioB)&&!s.visual)return {...s,feedback:'두 코드를 모두 듣거나 그림 비교를 확인해요.',kind:'retry'};
 if(s.step===11&&!s.explained)return {...s,feedback:'가운데 음과 두 간격의 변화를 확인해요.',kind:'retry'};
 const step=s.step+1;return {...s,step,quality:step>=7?'minor':'major',active:tutorialSlot(step)??1,visual:step===10?false:s.visual,complete:step===13,feedback:'다음 레시피를 살펴볼까요?',kind:'info'};
}
if(a.type==='SUBMIT'){
 if(s.mode==='tutorial')return s;
 const l=lessonFor(s);if(l.kind==='compare'){if(!(s.audioA&&s.audioB)&&!s.visual)return {...s,feedback:'두 소리 또는 그림을 비교한 뒤 완료해요.',kind:'retry'};return {...s,complete:true,kind:'success',feedback:'두 코드의 공통 음과 달라진 음을 확인했어요!'};}
 if(s.notes.some(n=>n===null))return {...s,feedback:'비어 있는 재료 칸을 먼저 채워 주세요.',kind:'retry'};
 if(!isCorrect(s)){const i=target(s).findIndex((n,i)=>n.midi!==s.notes[i]);const current=s.notes[i]!;const expected=target(s)[i].midi;const octave=(current%12)===expected%12;return {...s,attempts:s.attempts+1,feedback:octave?'음이름은 맞아요. 이번 주문의 옥타브를 확인해요.':`${['근음','가운데 음','맨 위 음'][i]}의 간격을 확인해요. 지금 ${i===0?'근음이 달라요':`${current-s.notes[i-1]!}반음`}, 목표는 ${i===0?noteLabel(target(s)[0],true):`${expected-target(s)[i-1].midi}반음`}이에요.`,kind:'retry'};}
 return {...s,complete:true,feedback:'주문 완성! 나만의 레시피북에 기록했어요.',kind:'success'};
}
if(a.type==='CONFIG'){
 if(s.mode!=='practice')return s;
 try{makeTriad(a.root,a.quality);}catch{return {...s,feedback:'이 근음과 화음 조합은 지원 범위를 확인해 주세요.',kind:'retry'};}
 return {...startGame('practice'),root:a.root,quality:a.quality};
}
if(a.type==='FILL'){if(s.mode!=='practice')return s;return {...s,history:[...s.history,s.notes],notes:target(s).map(n=>n.midi) as Notes,maxHint:3,hint:3,sequenceHeard:false,chordHeard:false,audioA:false,audioB:false,visual:false,feedback:'레시피를 펼쳤어요. 한 음씩 바꾸며 비교해 보세요.'};}
if(a.type==='SNAPSHOT')return {...s,before:[...s.notes],feedback:'지금 소리를 비교 전 접시로 남겼어요.'};
return s;
}
export function displayedNotes(s:GameState){
 const q=target(s);
 if(s.mode==='practice'){
  const quality=identify(s.notes);
  if(quality&&s.notes[0]!==null){
   const root=q[0].midi===s.notes[0]?q[0]:midiNote(s.notes[0]);
   try{return makeTriad(noteLabel(root),quality,root.octave);}catch{/* Unrepresentable exploratory spelling falls back to keyboard labels. */}
  }
  return s.notes.map(n=>n===null?null:midiNote(n));
 }
 return s.notes.map((n,i)=>n===null?null:n===q[i].midi?q[i]:midiNote(n));
}

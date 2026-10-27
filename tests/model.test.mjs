import test from 'node:test';
import assert from 'node:assert/strict';
import {seedState,validateTask,filterTasks,saveTask,setTaskStatus,getStats,readState,writeState} from '../dist/model.mjs';
const today='2026-10-28';
const task={id:'t1',title:'Thiết kế dashboard',description:'Mô tả',project:'p1',assignee:'an',priority:'high',status:'todo',due:'2026-10-29',createdAt:'2026-10-27',completedAt:null};
test('invalid title, status, priority and impossible date produce field errors',()=>{
 const errors=validateTask({...task,title:' ',status:'bad',priority:'bad',due:'2026-02-31'});
 for(const key of ['title','status','priority','due'])assert.ok(errors[key]);
 assert.deepEqual(validateTask(task),{});
});
test('combined accent-insensitive search and filters return matching tasks only',()=>{
 const rows=[task,{...task,id:'t2',project:'p2',status:'done'},{...task,id:'t3',priority:'low'}];
 assert.deepEqual(filterTasks(rows,{search:'thiet ke',project:'p1',status:'todo',priority:'high'}).map(t=>t.id),['t1']);
 assert.deepEqual(filterTasks(rows,{search:'notfound'}),[]);
 assert.equal(filterTasks(rows,{}).length,3);
});
test('saving tasks adds or edits immutably and rejects invalid tasks',()=>{
 const original={version:1,tasks:[task]};
 const added=saveTask(original,{...task,id:'t2',title:'Việc mới'},today);
 assert.equal(original.tasks.length,1);assert.equal(added.tasks.length,2);
 const edited=saveTask(added,{...task,title:'Đã chỉnh sửa'},today);
 assert.equal(edited.tasks.length,2);assert.equal(edited.tasks.find(t=>t.id==='t1').title,'Đã chỉnh sửa');
 assert.throws(()=>saveTask(original,{...task,title:''},today));
});
test('status transitions set and clear completion date without editing original',()=>{
 const original={version:1,tasks:[task]};
 const done=setTaskStatus(original,'t1','done',today);
 assert.equal(done.tasks[0].completedAt,today);assert.equal(original.tasks[0].status,'todo');
 assert.equal(setTaskStatus(done,'t1','todo',today).tasks[0].completedAt,null);
 assert.throws(()=>setTaskStatus(original,'t1','bad',today));
});
test('stats exclude completed tasks from overdue and compute completion rate',()=>{
 const rows=[{...task,due:'2026-10-27'},{...task,id:'t2',status:'done',due:'2026-10-26',completedAt:today},{...task,id:'t3',due:today}];
 const stats=getStats(rows,today);
 assert.equal(stats.total,3);assert.equal(stats.done,1);assert.equal(stats.overdue,1);assert.equal(stats.dueToday,1);assert.equal(stats.rate,33);
});
test('corrupt, missing, mismatched and inaccessible storage recover to valid sample',()=>{
 for(const raw of [null,'{bad','{}',JSON.stringify({version:1,tasks:[{}]}),JSON.stringify({version:1,tasks:[{...task,tags:'bad'}]})]){
  const loaded=readState({getItem:()=>raw},today);assert.ok(loaded.tasks.length>0);assert.deepEqual(validateTask(loaded.tasks[0]),{});
 }
 assert.ok(readState({getItem:()=>{throw Error('blocked');}},today).tasks.length>0);
 const empty={version:1,tasks:[]};assert.deepEqual(readState({getItem:()=>JSON.stringify(empty)},today),empty);
});
test('storage save reports failure without throwing and roundtrips valid state',()=>{
 assert.equal(writeState({setItem:()=>{throw Error('quota');}},seedState(today)),false);
 let raw;const storage={setItem:(key,value)=>{raw=value;},getItem:()=>raw};
 const state=seedState(today);assert.equal(writeState(storage,state),true);assert.deepEqual(readState(storage,today),state);
});
test('corrupt stored tags are rejected before they can break card rendering',()=>{
 assert.ok(validateTask({...task,tags:'not-an-array'}).tags);
 const loaded=readState({getItem:()=>JSON.stringify({version:1,tasks:[{...task,tags:'bad'}]})},today);
 assert.ok(Array.isArray(loaded.tasks[0].tags));
});

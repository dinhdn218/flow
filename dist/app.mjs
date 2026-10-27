import {projects,members,statuses,localDate,seedState,validateTask,filterTasks,saveTask,setTaskStatus,readState,writeState} from './model.mjs';
import {resolveTheme,changeTheme} from './theme.mjs';
import {esc,icon,landing,shell,overview,workPage,boardContent,listContent,taskDialog,formatDate} from './ui.mjs';

const root=document.querySelector('#root');
const editor=document.querySelector('#task-dialog');
const confirmDialog=document.querySelector('#confirm-dialog');
const toastEl=document.querySelector('#toast');
let storage;
try{storage=window.localStorage;}catch{storage={getItem:()=>{throw Error('Storage unavailable');},setItem:()=>{throw Error('Storage unavailable');}};}
let state=readState(storage,localDate());
let filters={search:'',project:'all',priority:'all',status:'all',sort:'due'};
let currentRoute='landing';
let taskScope='today';
let editingId=null;
let toastTimer;
let undoAction=null;
let confirmAction=null;
let draggedId=null;
let searchFocus=false;

function notify(message,undo=null){
 clearTimeout(toastTimer);undoAction=undo;
 toastEl.innerHTML=`<span>${esc(message)}</span>${undo?'<button data-action="undo">Hoàn tác</button>':'<button data-action="dismiss-toast" aria-label="Đóng thông báo">×</button>'}`;
 toastEl.hidden=false;toastTimer=setTimeout(()=>{toastEl.hidden=true;undoAction=null;},undo?10000:5000);
 document.querySelector('#live-region').textContent=message;
}
function syncTheme(){
 const dark=document.documentElement.dataset.theme==='dark';
 document.querySelector('#theme-color').content=dark?'#12141e':'#f7f8fc';
 document.querySelectorAll('[data-action="theme"]').forEach(button=>{
  button.innerHTML=icon(dark?'sun':'moon');button.setAttribute('aria-pressed',String(dark));
  button.setAttribute('aria-label',dark?'Chuyển sang giao diện sáng':'Chuyển sang giao diện tối');
  button.title=dark?'Giao diện sáng':'Giao diện tối';
 });
}
document.documentElement.dataset.theme=resolveTheme(storage,matchMedia('(prefers-color-scheme:dark)').matches);
function parseLocation(){
 const [path,query='']=(location.hash.slice(1)||'/').split('?');
 const params=new URLSearchParams(query);
 const route=path==='/'?'landing':path==='/app'?'app':path==='/board'?'board':path==='/tasks'?'tasks':'notfound';
 const next={search:params.get('search')||'',project:params.get('project')||'all',priority:params.get('priority')||'all',status:params.get('status')||'all',sort:params.get('sort')||'due'};
 if(!projects.some(p=>p.id===next.project))next.project='all';
 if(!['all','high','medium','low'].includes(next.priority))next.priority='all';
 if(!['all',...Object.keys(statuses)].includes(next.status))next.status='all';
 if(!['due','title','priority'].includes(next.sort))next.sort='due';
 return {route,filters:next};
}
function writeFilterURL(){
 const params=new URLSearchParams();for(const [key,value] of Object.entries(filters))if(value&&value!=='all'&&!(key==='sort'&&value==='due'))params.set(key,value);
 history.replaceState(null,'',`#/${currentRoute}${params.size?'?'+params:''}`);
}
function render(focus=false){
 const parsed=parseLocation();currentRoute=parsed.route;filters=parsed.filters;
 const today=localDate();
 document.body.classList.remove('sidebar-open');
 if(currentRoute==='landing')root.innerHTML=landing(state,today);
 else if(currentRoute==='notfound')root.innerHTML=`<main id="main" tabindex="-1" class="empty-state"><h1>Không tìm thấy trang này.</h1><p>Quay về không gian làm việc để tiếp tục.</p><a class="button" href="#/app">Về workspace ${icon('arrow')}</a></main>`;
 else root.innerHTML=shell(currentRoute==='app'?overview(state,today,taskScope):workPage(currentRoute,state,today,filters),currentRoute,state,today,filters);
 document.title=currentRoute==='landing'?'Flow — Biến kế hoạch thành tiến độ':`Flow — ${{app:'Tổng quan',board:'Bảng công việc',tasks:'Tất cả công việc'}[currentRoute]||'Trang không tồn tại'}`;
 syncTheme();
 if(focus){window.scrollTo({top:0,behavior:'instant'});document.querySelector('#main')?.focus({preventScroll:true});}
 if(searchFocus&&currentRoute==='tasks'){document.querySelector('#task-search')?.focus();searchFocus=false;}
}
function persist(next,message,undo=null){
 const y=window.scrollY;state=next;
 const saved=writeState(storage,state);render();window.scrollTo({top:y,behavior:'instant'});
 if(!saved)notify((message?message+' ':'')+'Thay đổi chỉ lưu trong phiên này vì trình duyệt chặn lưu trữ.',undo);
 else if(message)notify(message,undo);
}
function openTask(id=null,status='todo'){
 const found=id?state.tasks.find(t=>t.id===id):null;if(id&&!found)return;
 editingId=found?.id||null;
 const task=found||{title:'',description:'',project:filters.project!=='all'?filters.project:'p1',assignee:'an',status,priority:'medium',due:'',tags:[]};
 editor.innerHTML=taskDialog(task,!found);editor.showModal();editor.querySelector('#task-title').focus();
}
function updateResults(){
 const tasks=filterTasks(state.tasks,filters);const results=document.querySelector('#work-results');
 if(results)results.innerHTML=currentRoute==='board'?boardContent(tasks,localDate()):listContent(tasks,localDate());
 const count=document.querySelector('#result-count');if(count)count.textContent=tasks.length+' công việc';
 writeFilterURL();
}
function ask({title,text,button='Đồng ý',action}){
 confirmAction=action;confirmDialog.innerHTML=`<h2 id="confirm-title">${esc(title)}</h2><p>${esc(text)}</p><div class="confirm-dialog-actions"><button class="button secondary" data-action="close-confirm">Hủy</button><button class="button" data-action="confirm">${esc(button)}</button></div>`;
 confirmDialog.showModal();
}
function info(title,text){
 confirmAction=null;confirmDialog.innerHTML=`<h2 id="confirm-title">${esc(title)}</h2><p>${esc(text)}</p><div class="confirm-dialog-actions"><button class="button" data-action="close-confirm">Đã hiểu</button></div>`;confirmDialog.showModal();
}
function showNotifications(){
 const tasks=state.tasks.filter(t=>t.status!=='done'&&t.due&&t.due<=localDate());
 confirmDialog.innerHTML=`<h2 id="confirm-title">Những việc cần chú ý</h2><p>${tasks.length?'Đến hạn hoặc quá hạn. Chọn một việc để xem chi tiết.':'Bạn chưa có công việc đến hạn hoặc quá hạn.'}</p><div class="notice-list">${tasks.slice(0,8).map(t=>`<button data-notice-task="${esc(t.id)}">${esc(t.title)}<small>${formatDate(t.due)} · ${projects.find(p=>p.id===t.project)?.name}</small></button>`).join('')}</div><div class="confirm-dialog-actions"><button class="button secondary" data-action="close-confirm">Đóng</button></div>`;
 confirmDialog.showModal();
}
document.addEventListener('click',event=>{
 const target=event.target.closest('button,a');if(!target)return;
 const action=target.dataset.action;
 if(action==='theme'){
  document.documentElement.dataset.theme=changeTheme(document.documentElement.dataset.theme,storage);syncTheme();
  document.querySelector('#live-region').textContent=document.documentElement.dataset.theme==='dark'?'Đã bật giao diện tối':'Đã bật giao diện sáng';return;
 }
 if(target.classList.contains('skip-link')){event.preventDefault();document.querySelector('#main')?.focus();return;}
 if(target.dataset.scroll){event.preventDefault();document.getElementById(target.dataset.scroll)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});return;}
 if(target.dataset.edit){openTask(target.dataset.edit);return;}
 if(target.dataset.noticeTask){confirmDialog.close();openTask(target.dataset.noticeTask);return;}
 if(target.dataset.complete){
  const task=state.tasks.find(t=>t.id===target.dataset.complete);if(!task)return;
  const next=task.status==='done'?'todo':'done';persist(setTaskStatus(state,task.id,next),next==='done'?'Một việc đã xong. Tiếp tục giữ nhịp nhé!':'Đã chuyển công việc về Cần làm.');
  const same=document.querySelector(`[data-complete="${CSS.escape(task.id)}"]`);(same||document.querySelector('#main'))?.focus({preventScroll:true});return;
 }
 if(target.dataset.scope){taskScope=target.dataset.scope;render();document.querySelector(`[data-scope="${taskScope}"]`)?.focus({preventScroll:true});return;}
 if(target.dataset.newStatus){openTask(null,target.dataset.newStatus);return;}
 if(target.dataset.delete){
  const task=state.tasks.find(t=>t.id===target.dataset.delete);if(!task)return;
  editor.close();persist({...state,tasks:state.tasks.filter(t=>t.id!==task.id)},'Đã xóa công việc.',()=>{if(!state.tasks.some(t=>t.id===task.id))persist({...state,tasks:[task,...state.tasks]},'Đã khôi phục công việc.');});return;
 }
 switch(action){
  case 'new-task':openTask();break;
  case 'close-dialog':editor.close();break;
  case 'close-confirm':confirmDialog.close();break;
  case 'confirm':{const callback=confirmAction;confirmAction=null;confirmDialog.close();callback?.();break;}
  case 'undo':{const callback=undoAction;undoAction=null;toastEl.hidden=true;callback?.();break;}
  case 'dismiss-toast':toastEl.hidden=true;break;
  case 'menu':document.body.classList.toggle('sidebar-open');target.setAttribute('aria-expanded',String(document.body.classList.contains('sidebar-open')));break;
  case 'close-menu':document.body.classList.remove('sidebar-open');document.querySelector('[data-action="menu"]')?.setAttribute('aria-expanded','false');break;
  case 'notifications':showNotifications();break;
  case 'clear-filters':{filters={search:'',project:'all',priority:'all',status:'all',sort:'due'};writeFilterURL();render();break;}
  case 'about':info('Flow — Portfolio concept','Một bản demo công cụ quản lý công việc dành cho freelancer và nhóm nhỏ. Dự án, thành viên và số liệu ban đầu là dữ liệu giả định. Bạn có thể thêm/sửa công việc, đổi trạng thái, dùng bộ lọc và chuyển theme. Thay đổi chỉ lưu trên trình duyệt này; không có tài khoản, đồng bộ đám mây hay thông báo gửi đến người khác.');break;
  case 'workspace-info':info('Studio Workspace','Đây là không gian làm việc mẫu với 4 thành viên giả định. Bạn có thể chọn một thành viên để phân công trong form công việc. Bản demo không gửi thông báo hoặc mời người dùng thực tế.');break;
  case 'reset':ask({title:'Bắt đầu lại với dữ liệu mẫu?',text:'Các công việc bạn đã thêm hoặc chỉnh sửa trên trình duyệt này sẽ được thay bằng dữ liệu mẫu. Theme sáng/tối bạn chọn vẫn được giữ lại.',button:'Khôi phục dữ liệu mẫu',action:()=>persist(seedState(localDate()),'Đã khôi phục dữ liệu mẫu.')});break;
 }
});
// The scrim is a non-button surface; delegation keeps it working after renders.
document.addEventListener('click',event=>{if(event.target.classList.contains('sidebar-scrim')){document.body.classList.remove('sidebar-open');document.querySelector('[data-action="menu"]')?.setAttribute('aria-expanded','false');}});
document.addEventListener('input',event=>{
 if(event.target.id==='task-search'){filters.search=event.target.value;updateResults();}
});
document.addEventListener('change',event=>{
 if(event.target.dataset.filter){filters[event.target.dataset.filter]=event.target.value;updateResults();}
 if(event.target.dataset.move){const id=event.target.dataset.move;persist(setTaskStatus(state,id,event.target.value),'Đã cập nhật trạng thái công việc.');document.querySelector(`[data-move="${CSS.escape(id)}"]`)?.focus({preventScroll:true});}
});
document.addEventListener('submit',event=>{
 if(event.target.id==='global-search-form'){
  event.preventDefault();const value=new FormData(event.target).get('search');searchFocus=true;const hash='/tasks'+(value?'?search='+encodeURIComponent(value):'');if(location.hash.slice(1)===hash)render();else location.hash=hash;return;
 }
 if(event.target.id!=='task-form')return;
 event.preventDefault();const form=event.target;const previous=state.tasks.find(t=>t.id===editingId);
 const values=Object.fromEntries(new FormData(form));const task={...previous,...values,id:editingId||crypto.randomUUID(),tags:previous?.tags||[]};
 const errors=validateTask(task);
 for(const field of ['title','project','assignee','status','priority','due']){
  form.elements[field].setAttribute('aria-invalid',String(Boolean(errors[field])));document.querySelector('#error-'+field).textContent=errors[field]||'';
 }
 if(Object.keys(errors).length){form.elements[Object.keys(errors)[0]].focus();return;}
 const isNew=!editingId;editor.close();persist(saveTask(state,task),isNew?'Đã thêm công việc mới.':'Đã lưu thay đổi.');document.querySelector('#main')?.focus({preventScroll:true});
});
root.addEventListener('dragstart',event=>{
 const card=event.target.closest('[data-drag]');if(!card)return;draggedId=card.dataset.drag;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',draggedId);card.classList.add('dragging');
});
root.addEventListener('dragover',event=>{const column=event.target.closest('[data-column]');if(!column||!draggedId)return;event.preventDefault();event.dataTransfer.dropEffect='move';document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));column.classList.add('drag-over');});
root.addEventListener('drop',event=>{const column=event.target.closest('[data-column]');if(!column||!draggedId)return;event.preventDefault();const task=state.tasks.find(t=>t.id===draggedId);if(task&&task.status!==column.dataset.column)persist(setTaskStatus(state,task.id,column.dataset.column),'Đã chuyển công việc sang '+statuses[column.dataset.column]+'.');draggedId=null;document.querySelectorAll('.drag-over,.dragging').forEach(x=>x.classList.remove('drag-over','dragging'));});
root.addEventListener('dragend',()=>{draggedId=null;document.querySelectorAll('.drag-over,.dragging').forEach(x=>x.classList.remove('drag-over','dragging'));});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&document.body.classList.contains('sidebar-open')){document.body.classList.remove('sidebar-open');const button=document.querySelector('[data-action="menu"]');button?.setAttribute('aria-expanded','false');button?.focus();}
});
for(const dialog of [editor,confirmDialog])dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
window.addEventListener('hashchange',()=>{if(editor.open)editor.close();if(confirmDialog.open)confirmDialog.close();render(true);});
window.addEventListener('storage',event=>{
 if(event.key==='flow.theme.v1'){document.documentElement.dataset.theme=resolveTheme(storage,matchMedia('(prefers-color-scheme:dark)').matches);syncTheme();}
 if(event.key==='flow.workspace.v1'&&!editor.open){state=readState(storage,localDate());render();}
});
render();

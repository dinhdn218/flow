export const STORAGE_KEY='flow.workspace.v1';
export const projects=[
 {id:'p1',name:'Website Flow',color:'violet',initial:'F',description:'Thiết kế trải nghiệm quản lý công việc đơn giản hơn.',dueOffset:12},
 {id:'p2',name:'Nhận diện thương hiệu',color:'orange',initial:'B',description:'Một diện mạo mới, nhất quán ở mọi điểm chạm.',dueOffset:8},
 {id:'p3',name:'Ứng dụng di động',color:'blue',initial:'M',description:'Đưa trải nghiệm Flow đến gần bạn hơn.',dueOffset:20}
];
export const members=[{id:'an',name:'Minh An',initial:'MA',color:'violet'},{id:'linh',name:'Thùy Linh',initial:'TL',color:'pink'},{id:'minh',name:'Quang Minh',initial:'QM',color:'blue'},{id:'ha',name:'Ngọc Hà',initial:'NH',color:'orange'}];
export const statuses={todo:'Cần làm',doing:'Đang làm',done:'Hoàn thành'};
export const priorities={high:'Cao',medium:'Vừa',low:'Thấp'};
export function localDate(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function offsetDate(today,offset){const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===value;}
export function seedState(today=localDate()){
 const templates=[
 ['Khám phá luồng onboarding','p1','linh','high','doing',0,'Rút gọn các bước để người dùng tạo công việc đầu tiên thật dễ dàng.',['UX Research','Product']],
 ['Thiết kế giao diện Dashboard','p1','an','high','doing',0,'Hoàn thiện bố cục tổng quan, thống kê tiến độ và trạng thái công việc.',['UI Design']],
 ['Xây dựng thư viện thành phần','p1','ha','medium','todo',2,'Chuẩn hóa button, input, badge và trạng thái tương tác trong design system.',['Design System']],
 ['Kiểm thử responsive trên mobile','p1','minh','high','todo',1,'Kiểm tra các màn hình ở kích thước 375, 768 và 1440 px.',['Development']],
 ['Moodboard nhận diện thương hiệu','p2','linh','medium','done',-2,'Chốt hướng hình ảnh, bảng màu và ngôn ngữ thiết kế.',['Branding']],
 ['Phát triển concept logo','p2','ha','high','doing',1,'Khám phá các phương án biểu tượng và hệ thống typography.',['Branding','Design']],
 ['Soạn nội dung trang giới thiệu','p1','an','low','todo',4,'Kể câu chuyện sản phẩm qua những lợi ích dễ hình dung.',['Content']],
 ['Đánh giá trải nghiệm prototype','p3','minh','medium','done',-1,'Tổng hợp các điểm cần cải thiện từ buổi thử nghiệm giả định.',['UX Research']],
 ['Thiết kế màn hình công việc','p3','an','medium','doing',3,'Tối ưu giao diện chi tiết công việc cho thao tác một tay.',['UI Design','Mobile']],
 ['Hoàn thiện bảng màu sáng / tối','p1','ha','medium','done',-1,'Đảm bảo tương phản và tính nhất quán giữa hai giao diện.',['Design System']],
 ['Chuẩn bị bộ icon sản phẩm','p3','linh','low','todo',5,'Xây dựng bộ icon đồng nhất, rõ nghĩa và dễ nhận biết.',['Illustration']],
 ['Nghiên cứu người dùng mục tiêu','p1','minh','high','done',-4,'Xây dựng giả thuyết về nhu cầu của freelancer và nhóm nhỏ.',['UX Research']],
 ['Thiết kế bộ danh thiếp','p2','ha','low','todo',6,'Ứng dụng nhận diện vào các ấn phẩm văn phòng cơ bản.',['Branding']],
 ['Cập nhật tài liệu bàn giao','p2','an','medium','todo',-1,'Tổng hợp quy tắc sử dụng logo và hướng dẫn xuất tài nguyên.',['Documentation']],
 ['Phác thảo cấu trúc thông tin','p3','linh','medium','done',-3,'Nhóm các chức năng chính theo hành trình người dùng.',['Product']]
 ];
 return {version:1,tasks:templates.map((r,i)=>({id:'task-'+(i+1),title:r[0],project:r[1],assignee:r[2],priority:r[3],status:r[4],due:offsetDate(today,r[5]),description:r[6],tags:r[7],createdAt:offsetDate(today,-7-i%5),updatedAt:offsetDate(today,Math.min(r[5],0)),completedAt:r[4]==='done'?offsetDate(today,r[5]):null}))};
}
export function validateTask(task){
 const e={};if(typeof task.title!=='string'||task.title.trim().length<2||task.title.trim().length>120)e.title='Nhập tên công việc từ 2 đến 120 ký tự.';
 if(!Object.hasOwn(statuses,task.status))e.status='Chọn trạng thái hợp lệ.';
 if(!Object.hasOwn(priorities,task.priority))e.priority='Chọn mức ưu tiên.';
 if(!projects.some(p=>p.id===task.project))e.project='Chọn dự án hợp lệ.';
 if(!members.some(m=>m.id===task.assignee))e.assignee='Chọn người phụ trách.';
 if(task.due&&!validDate(task.due))e.due='Chọn ngày hợp lệ.';
 if(task.tags!==undefined&&(!Array.isArray(task.tags)||task.tags.some(tag=>typeof tag!=='string')))e.tags='Nhãn công việc không hợp lệ.';
 return e;
}
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
export function filterTasks(tasks,filters={}){
 let result=tasks.filter(t=>(!filters.search||normalize(t.title+' '+(t.description||'')).includes(normalize(filters.search)))&&(!filters.project||filters.project==='all'||t.project===filters.project)&&(!filters.status||filters.status==='all'||t.status===filters.status)&&(!filters.priority||filters.priority==='all'||t.priority===filters.priority)&&(!filters.assignee||filters.assignee==='all'||t.assignee===filters.assignee));
 const ranks={high:0,medium:1,low:2};
 if(filters.sort==='due')result.sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
 if(filters.sort==='priority')result.sort((a,b)=>ranks[a.priority]-ranks[b.priority]);
 if(filters.sort==='title')result.sort((a,b)=>a.title.localeCompare(b.title,'vi'));
 return result;
}
export function saveTask(state,task,now=localDate()){
 if(Object.keys(validateTask(task)).length)throw Error('Invalid task');
 const previous=state.tasks.find(t=>t.id===task.id);
 const clean={...task,title:task.title.trim(),description:String(task.description||'').slice(0,3000),createdAt:previous?.createdAt||now,updatedAt:now,completedAt:task.status==='done'?(previous?.status==='done'?previous.completedAt:now):null};
 return {...state,tasks:previous?state.tasks.map(t=>t.id===task.id?clean:t):[clean,...state.tasks]};
}
export function setTaskStatus(state,id,status,now=localDate()){
 if(!Object.hasOwn(statuses,status))throw Error('Invalid status');
 const task=state.tasks.find(t=>t.id===id);if(!task)return state;
 return saveTask(state,{...task,status},now);
}
export function getStats(tasks,today=localDate()){
 const done=tasks.filter(t=>t.status==='done').length;
 return {total:tasks.length,done,doing:tasks.filter(t=>t.status==='doing').length,todo:tasks.filter(t=>t.status==='todo').length,overdue:tasks.filter(t=>t.status!=='done'&&t.due&&t.due<today).length,dueToday:tasks.filter(t=>t.status!=='done'&&t.due===today).length,rate:tasks.length?Math.round(done/tasks.length*100):0};
}
export function readState(storage,today=localDate()){
 try{const parsed=JSON.parse(storage.getItem(STORAGE_KEY));if(parsed?.version===1&&Array.isArray(parsed.tasks)&&parsed.tasks.every(t=>t&&typeof t.id==='string'&&!Object.keys(validateTask(t)).length))return parsed;}catch{}
 return seedState(today);
}
export function writeState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}

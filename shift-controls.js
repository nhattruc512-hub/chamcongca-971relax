// Keep shift choices visible but locked while another shift is active, and allow other devices to close via manager PIN.
(function(){
  const ENDPOINT='https://dinqlgaveujdeyisgpty.supabase.co/functions/v1/manager-close-active-shift';
  const el=id=>document.getElementById(id);

  function ensureUI(){
    const start=el('startCard');
    if(start&&!el('shiftBusyNotice')){
      const n=document.createElement('div');
      n.id='shiftBusyNotice';
      n.className='notice hidden';
      const grid=start.querySelector('.shift-grid');
      if(grid)start.insertBefore(n,grid);
    }
    const card=el('activeCard');
    if(card&&!el('managerPinCloseBtn')){
      const b=document.createElement('button');
      b.id='managerPinCloseBtn';
      b.type='button';
      b.className='btn danger block hidden';
      b.textContent='ĐÓNG CA BẰNG PIN QUẢN LÝ';
      const finish=el('finishShiftBtn');
      if(finish)finish.after(b);else card.appendChild(b);
      b.addEventListener('click',closeWithPin);
    }
  }

  function apply(){
    ensureUI();
    const start=el('startCard'),notice=el('shiftBusyNotice'),pinBtn=el('managerPinCloseBtn'),finish=el('finishShiftBtn');
    if(start)start.classList.remove('hidden');
    const running=typeof active!=='undefined'&&!!active;
    document.querySelectorAll('.shift').forEach(b=>b.disabled=running);
    const startBtn=el('startShiftBtn');if(startBtn&&running)startBtn.disabled=true;
    if(notice){
      notice.classList.add('hidden');
      notice.textContent='';
    }
    const own=running&&typeof isOwner==='function'&&isOwner();
    if(finish)finish.classList.toggle('hidden',!own);
    if(pinBtn)pinBtn.classList.toggle('hidden',!running||own);
  }

  async function closeWithPin(){
    if(typeof active==='undefined'||!active)return toast('Không có ca đang hoạt động');
    const pin=prompt('Nhập PIN quản lý để đóng ca trên máy khác');
    if(pin===null)return;
    if(!pin.trim())return toast('Chưa nhập PIN quản lý');
    const current={...active};
    if(!confirm(`Đóng ${current.shiftName} của ${current.employee} bằng PIN quản lý?\n\nDoanh thu hiện tại vẫn được lưu vào lịch sử.`))return;
    const btn=el('managerPinCloseBtn');btn.disabled=true;
    try{
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','x-manager-pin':pin.trim()},body:JSON.stringify({id:current.id})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||`Lỗi ${r.status}`);
      localStorage.removeItem('r971_shared_shift_owner_v1');
      active=null;
      if(typeof refreshAll==='function')await refreshAll();
      if(typeof renderActive==='function')renderActive();
      apply();
      toast(`Đã đóng ${current.shiftName} bằng PIN quản lý`);
    }catch(e){toast(e.message||'Không đóng được ca')}
    finally{btn.disabled=false}
  }

  const oldRender=typeof renderActive==='function'?renderActive:null;
  if(oldRender){
    renderActive=function(){oldRender();apply()};
  }
  function boot(){ensureUI();apply();setInterval(apply,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

// Up to two staff may join the same active shift. A device that started/joined the shift can finish without PIN.
// Other devices can only close the active shift through the manager PIN control mounted by manager-close.js.
(function(){
  const el=id=>document.getElementById(id);

  function peopleFrom(r){
    const list=Array.isArray(r?.participants)?r.participants.map(x=>String(x||'').trim()).filter(Boolean):[];
    return list.length?list:String(r?.employee||'').split('+').map(x=>x.trim()).filter(Boolean);
  }

  rowToActive=function(r){
    if(!r)return null;
    const participants=peopleFrom(r);
    return{id:r.id,dateKey:r.date_key,shiftKey:r.shift_key,shiftName:r.shift_name,scheduledTime:r.scheduled_time,employee:participants.join(' + ')||r.employee,startAt:r.start_at,totals:r.totals||{},entries:Array.isArray(r.entries)?r.entries:[],participants};
  };

  refreshActive=async function(){
    if(pollBusy)return;
    pollBusy=true;
    try{
      const rows=await rest('staff_active_shift?select=id,date_key,shift_key,shift_name,scheduled_time,employee,start_at,totals,entries,participants,updated_at&singleton_id=eq.1');
      const next=rowToActive(rows?.[0]||null);
      const changed=JSON.stringify(next)!==JSON.stringify(active);
      active=next;
      if(!active&&owner())localStorage.removeItem(OWNER_KEY);
      if(changed)renderActive();
      updateRevenueMode();
      updateStartButton();
    }catch(e){console.error(e)}finally{pollBusy=false}
  };

  updateStartButton=function(){
    const name=el('employeeName')?.value.trim();
    if(!active){el('startShiftBtn').disabled=!selectedShift||!name;return}
    const count=(active.participants||[]).length||1;
    el('startShiftBtn').disabled=!name||!selectedShift||selectedShift!==active.shiftKey||count>=2;
  };

  startShift=async function(){
    await refreshActive();
    const employee=el('employeeName').value.trim();
    if(!employee||!selectedShift)return toast('Nhập tên và chọn ca');
    const s=SHIFTS[selectedShift];
    if(active){
      const count=(active.participants||[]).length||1;
      if(selectedShift!==active.shiftKey)return toast(`Chỉ có thể thêm người vào ${active.shiftName}`);
      if(count>=2)return toast(`${active.shiftName} đã đủ 2 người`);
      if((active.participants||[]).some(x=>String(x).trim().toLowerCase()===employee.toLowerCase()))return toast('Nhân viên này đã có trong ca');
    }
    try{
      const d=await activeApi({action:'start',employee,shiftKey:selectedShift,shiftName:s.name,scheduledTime:s.time,dateKey:localDateKey()});
      active=rowToActive(d.active);
      localStorage.setItem(OWNER_KEY,JSON.stringify({id:active.id,token:d.token}));
      rememberEmployee(employee);
      selectedShift='';
      document.querySelectorAll('.shift').forEach(b=>b.classList.remove('selected'));
      renderActive();
      updateStartButton();
      toast(d.joined?`Đã thêm ${employee} vào ${active.shiftName}`:`Đã bắt đầu ${active.shiftName}`);
    }catch(e){
      if(e.status===409&&e.data?.active){active=rowToActive(e.data.active);renderActive();updateStartButton()}
      toast(e.message)
    }
  };

  function ensureUI(){
    const start=el('startCard');
    if(start&&!el('shiftBusyNotice')){
      const n=document.createElement('div');n.id='shiftBusyNotice';n.className='notice hidden';
      const grid=start.querySelector('.shift-grid');if(grid)start.insertBefore(n,grid);
    }
    // Remove the old duplicate PIN button if an older cached script created it.
    const duplicate=el('managerPinCloseBtn');
    if(duplicate)duplicate.remove();
  }

  function participantCount(){
    if(typeof active==='undefined'||!active)return 0;
    const p=Array.isArray(active.participants)?active.participants:[];
    return p.length||1;
  }

  function apply(){
    ensureUI();
    const start=el('startCard'),notice=el('shiftBusyNotice'),finish=el('finishShiftBtn'),remote=el('managerRemoteCloseBtn');
    if(start)start.classList.remove('hidden');
    const running=typeof active!=='undefined'&&!!active,count=participantCount();
    document.querySelectorAll('.shift').forEach(b=>{b.disabled=running&&(count>=2||b.dataset.shift!==active.shiftKey)});
    if(notice){notice.classList.add('hidden');notice.textContent=''}
    if(typeof updateStartButton==='function')updateStartButton();

    // OWNER_KEY is only issued by the server after this device successfully starts/joins the active shift.
    const own=running&&typeof isOwner==='function'&&isOwner();
    if(finish)finish.classList.toggle('hidden',!own);
    if(remote)remote.classList.toggle('hidden',!running||own);
  }

  const oldRender=typeof renderActive==='function'?renderActive:null;
  if(oldRender){renderActive=function(){oldRender();apply()}}
  function boot(){ensureUI();apply();setInterval(apply,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

(function(){
  const ENDPOINT='https://dinqlgaveujdeyisgpty.supabase.co/functions/v1/manager-close-active-shift';
  const $id=id=>document.getElementById(id);

  function mount(){
    const panel=$id('managerPanel');
    if(!panel||$id('managerActiveShiftSection'))return;
    const section=document.createElement('div');
    section.id='managerActiveShiftSection';
    section.className='manager-section';
    section.innerHTML=`
      <div class="kicker">CA ĐANG HOẠT ĐỘNG</div>
      <p class="muted">Quản lý có thể đóng ca đang làm khi nhân viên quên hoặc không thể tự kết thúc ca.</p>
      <div id="managerActiveShiftBox" class="row" style="margin-top:10px"></div>
      <button id="managerCloseActiveShiftBtn" class="btn danger block hidden" type="button">ĐÓNG CA ĐANG LÀM</button>`;
    const firstSection=panel.querySelector('.manager-section');
    panel.insertBefore(section,firstSection||null);
    $id('managerCloseActiveShiftBtn').addEventListener('click',closeActiveShiftByManager);
    render();
    setInterval(render,1500);
  }

  function render(){
    const box=$id('managerActiveShiftBox'),btn=$id('managerCloseActiveShiftBtn');
    if(!box||!btn)return;
    if(typeof managerPin==='undefined'||!managerPin){
      box.innerHTML='<div class="row-main"><span>Mở Quản Lý để xem ca đang hoạt động.</span></div>';
      btn.classList.add('hidden');return;
    }
    if(typeof active==='undefined'||!active){
      box.innerHTML='<div class="row-main"><b>Không có ca đang hoạt động</b><span>Hệ thống đang mở để nhân viên chọn ca mới.</span></div>';
      btn.classList.add('hidden');return;
    }
    const t=active.totals||{};
    const revenue=Number(t.courtRevenue||0)+Number(t.waterRevenue||0);
    box.innerHTML=`<div class="row-main"><b>${esc(active.shiftName)} · ${esc(active.employee)}</b><span>Bắt đầu ${vnTime(active.startAt)} · ${esc(active.scheduledTime||'')}</span><small>Doanh thu hiện tại ${money(revenue)}</small></div>`;
    btn.classList.remove('hidden');
  }

  async function closeActiveShiftByManager(){
    if(typeof managerPin==='undefined'||!managerPin)return toast('Hãy mở Quản Lý trước');
    if(typeof active==='undefined'||!active)return toast('Không có ca đang hoạt động');
    const current={...active};
    if(!confirm(`Quản lý đóng ${current.shiftName} của ${current.employee}?\n\nDoanh thu hiện tại vẫn được lưu vào lịch sử ca.`))return;
    const btn=$id('managerCloseActiveShiftBtn');btn.disabled=true;
    try{
      const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','x-manager-pin':managerPin},body:JSON.stringify({id:current.id})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||`Lỗi ${r.status}`);
      localStorage.removeItem('r971_shared_shift_owner_v1');
      active=null;
      if(typeof renderActive==='function')renderActive();
      if(typeof refreshAll==='function')await refreshAll();
      if(typeof refreshManager==='function')await refreshManager();
      render();
      toast(`Quản lý đã đóng ${current.shiftName}`);
    }catch(e){toast(e.message||'Không đóng được ca')}
    finally{btn.disabled=false}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

// Manager: add revenue directly into the currently active shift. Entries are always recorded as "Quản Lí".
(function(){
  let currentActiveId='';
  const fmt=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0);
  const parse=v=>Number(String(v||'').replace(/\D/g,''))||0;

  function mount(){
    if(document.getElementById('managerRevenueEntryCard'))return;
    const activeCard=document.getElementById('activeTitle')?.closest('.card');
    if(!activeCard)return;
    const card=document.createElement('section');
    card.id='managerRevenueEntryCard';
    card.className='card';
    card.innerHTML=`
      <div class="head"><div><div class="kicker">GHI NHẬN DOANH THU</div><h2>Nhập vào ca đang hoạt động</h2><div class="muted">Người nhập mặc định: <b>Quản Lí</b></div></div><span id="managerRevenueEntryStatus" class="badge">ĐANG KIỂM TRA</span></div>
      <div class="grid" style="grid-template-columns:repeat(5,minmax(0,1fr));margin-top:12px" id="managerRevenueEntryGrid">
        <label class="stat"><span>Chuyển khoản</span><input id="mrTransfer" class="input" inputmode="numeric" placeholder="0" style="width:100%;margin-top:7px"></label>
        <label class="stat"><span>Tiền mặt</span><input id="mrCash" class="input" inputmode="numeric" placeholder="0" style="width:100%;margin-top:7px"></label>
        <label class="stat"><span>Lịch Oline</span><input id="mrOnline" class="input" inputmode="numeric" placeholder="0" style="width:100%;margin-top:7px"></label>
        <label class="stat"><span>Doanh thu sân</span><input id="mrCourt" class="input" inputmode="numeric" placeholder="0" style="width:100%;margin-top:7px"></label>
        <label class="stat"><span>Doanh thu nước</span><input id="mrWater" class="input" inputmode="numeric" placeholder="0" style="width:100%;margin-top:7px"></label>
      </div>
      <button id="managerAddRevenueBtn" class="btn primary" type="button" style="width:100%;margin-top:12px">+ CỘNG DOANH THU VÀO CA</button>
      <div id="managerRevenueEntryNotice" class="muted" style="margin-top:8px"></div>`;
    activeCard.insertAdjacentElement('afterend',card);
    card.querySelectorAll('input').forEach(el=>{
      el.addEventListener('input',()=>{const n=parse(el.value);el.value=n?fmt(n):''});
    });
    document.getElementById('managerAddRevenueBtn').onclick=addRevenue;
    updateState();
  }

  function updateState(){
    mount();
    const btn=document.getElementById('managerAddRevenueBtn');
    const badge=document.getElementById('managerRevenueEntryStatus');
    const notice=document.getElementById('managerRevenueEntryNotice');
    const inputs=['mrTransfer','mrCash','mrOnline','mrCourt','mrWater'].map(id=>document.getElementById(id));
    const on=!!currentActiveId;
    inputs.forEach(el=>{if(el)el.disabled=!on});
    if(btn)btn.disabled=!on;
    if(badge)badge.textContent=on?'SẴN SÀNG':'CHƯA CÓ CA';
    if(notice)notice.textContent=on?'Khoản nhập sẽ cộng trực tiếp vào ca đang hoạt động và hiện trong Diễn biến ca với tên Quản Lí.':'Hiện chưa có ca hoạt động nên chưa thể ghi nhận doanh thu.';
  }

  async function addRevenue(){
    if(!currentActiveId)return toast('Không có ca đang hoạt động');
    const transfer=parse(document.getElementById('mrTransfer')?.value),cash=parse(document.getElementById('mrCash')?.value),online=parse(document.getElementById('mrOnline')?.value),court=parse(document.getElementById('mrCourt')?.value),water=parse(document.getElementById('mrWater')?.value);
    if(!(transfer||cash||online||court||water))return toast('Hãy nhập ít nhất một khoản tiền');
    const btn=document.getElementById('managerAddRevenueBtn');btn.disabled=true;
    try{
      await manager('add_active_entry',currentActiveId,{transfer,cash,online,court,water});
      ['mrTransfer','mrCash','mrOnline','mrCourt','mrWater'].forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});
      toast('Đã cộng doanh thu vào ca · Quản Lí');
      await refreshAll();
    }catch(e){toast(e.message||'Không ghi nhận được doanh thu')}
    finally{updateState()}
  }

  const oldRenderActive=typeof renderActive==='function'?renderActive:null;
  if(oldRenderActive){renderActive=function(a){currentActiveId=a?.id?String(a.id):'';oldRenderActive(a);updateState()}}

  function boot(){mount();const id=document.getElementById('closeActiveBtn')?.dataset.id;currentActiveId=id||'';updateState()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

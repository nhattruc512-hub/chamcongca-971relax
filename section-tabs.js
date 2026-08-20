(function(){
  const items=[
    ['attendanceSection','Chấm công'],
    ['startCard','Bắt đầu ca'],
    ['quickRevenueCard','Doanh thu'],
    ['summarySection','Tổng hợp'],
    ['debtSection','Khách nợ'],
    ['activeCard','Ca hiện tại'],
    ['historySection','Lịch sử'],
    ['managerSection','Quản lý']
  ];
  let current='';
  const el=id=>document.getElementById(id);

  function mount(){
    const nav=document.querySelector('.quick-nav');
    if(!nav||nav.dataset.tabsReady)return;
    nav.dataset.tabsReady='1';
    const box=nav.querySelector('.quick-nav-in')||nav;
    box.innerHTML=items.map(([id,label])=>`<button type="button" class="top-tab" data-open-section="${id}">${label}</button>`).join('');
    items.forEach(([id])=>el(id)?.classList.add('tab-section'));
    box.querySelectorAll('[data-open-section]').forEach(btn=>btn.addEventListener('click',()=>open(btn.dataset.openSection)));
    refreshButtons();
  }

  function open(id){
    const target=el(id);if(!target)return;
    if(id==='activeCard'&&target.classList.contains('hidden')){if(typeof toast==='function')toast('Chưa có ca đang hoạt động');return}
    current=current===id?'':id;
    items.forEach(([sid])=>el(sid)?.classList.toggle('tab-open',sid===current));
    document.querySelectorAll('[data-open-section]').forEach(btn=>btn.classList.toggle('active',btn.dataset.openSection===current));
    if(current)window.scrollTo({top:document.querySelector('.quick-nav')?.offsetTop||0,behavior:'smooth'});
  }

  function refreshButtons(){
    const activeBtn=document.querySelector('[data-open-section="activeCard"]');
    if(activeBtn)activeBtn.disabled=!!el('activeCard')?.classList.contains('hidden');
    if(current==='activeCard'&&el('activeCard')?.classList.contains('hidden'))open('activeCard');
  }

  function boot(){mount();setInterval(refreshButtons,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

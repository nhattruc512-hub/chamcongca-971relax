(function(){
  const $id=id=>document.getElementById(id);
  const panels=['attendanceSection','startCard','quickRevenueCard','summarySection','debtSection','activeCard','historySection','managerSection'];
  let dashboard=null,backBar=null;

  function syncName(v){
    v=String(v||'').trim();
    if(!v)return;
    const a=$id('attendanceEmployee'),e=$id('employeeName');
    if(a)a.value=v;if(e)e.value=v;
    try{localStorage.setItem('r971_staff_employee_v1',v)}catch{}
  }

  function build(){
    const hero=document.querySelector('.hero');if(hero)hero.classList.add('dashboard-hero');
    const main=document.querySelector('main');if(!main)return;
    dashboard=document.createElement('section');dashboard.id='appDashboard';dashboard.className='app-dashboard';
    dashboard.innerHTML=`
      <div class="dash-staff">
        <label for="homeEmployee">Tên nhân viên</label>
        <input id="homeEmployee" class="input" maxlength="60" placeholder="Nhập tên nhân viên">
      </div>
      <div class="dash-actions">
        <button id="homePunchIn" class="punch-orb in" type="button"><span class="orb-icon">↪</span><span>Chấm công vào</span></button>
        <button id="homePunchOut" class="punch-orb out" type="button"><span class="orb-icon">↩</span><span>Chấm công ra</span></button>
      </div>
      <div class="dash-info">
        <button class="dash-info-item clickable" type="button" data-open="attendanceSection"><span class="info-icon">↻</span><span class="info-text"><span>Lịch sử</span><strong>Chấm công</strong></span></button>
        <div class="dash-info-item"><span class="info-icon warn">◷</span><span class="info-text"><span>Trễ</span><strong id="homeLateText">Đang kiểm tra</strong></span></div>
        <div class="dash-info-item"><span class="info-icon">▣</span><span class="info-text"><span>Ngày</span><strong id="homeDateText">--/--/----</strong></span></div>
      </div>
      <div class="dash-menu">
        <button class="dash-tile" type="button" data-open="startCard"><span class="dash-tile-icon">▶</span><strong>Bắt đầu ca</strong><span class="dash-arrow">›</span></button>
        <button class="dash-tile" type="button" data-open="quickRevenueCard"><span class="dash-tile-icon">↗</span><strong>Doanh thu</strong><span class="dash-arrow">›</span></button>
        <button class="dash-tile" type="button" data-open="summarySection"><span class="dash-tile-icon">◔</span><strong>Tổng hợp</strong><span class="dash-arrow">›</span></button>
        <button id="homeActiveTile" class="dash-tile" type="button" data-open="activeCard"><span class="dash-tile-icon">◎</span><strong>Ca hiện tại</strong><span class="dash-arrow">›</span></button>
        <button class="dash-tile" type="button" data-open="debtSection"><span class="dash-tile-icon">₫</span><strong>Khách nợ</strong><span class="dash-arrow">›</span></button>
        <button class="dash-tile" type="button" data-open="historySection"><span class="dash-tile-icon">◴</span><strong>Lịch sử</strong><span class="dash-arrow">›</span></button>
      </div>
      <div class="dash-bottom">
        <button class="dash-tile" type="button" data-report="1"><span class="dash-tile-icon">▥</span><strong>Báo cáo</strong><span class="dash-arrow">›</span></button>
        <button class="dash-tile" type="button" data-open="managerSection"><span class="dash-tile-icon">⚙</span><strong>Quản lý</strong><span class="dash-arrow">›</span></button>
      </div>`;
    main.before(dashboard);

    backBar=document.createElement('div');backBar.className='dash-back dashboard-hidden';backBar.innerHTML='<button type="button" id="dashBackBtn">‹ Trang chính</button>';main.before(backBar);

    panels.forEach(id=>{const el=$id(id);if(el)el.classList.add('app-panel-hidden')});
    const sectionAnchor=$id('shiftSection');if(sectionAnchor)sectionAnchor.classList.add('app-panel-hidden');

    const remembered=localStorage.getItem('r971_staff_employee_v1')||'';
    const home=$id('homeEmployee');if(home){home.value=remembered;home.addEventListener('input',()=>syncName(home.value));}
    syncName(remembered);

    $id('homePunchIn')?.addEventListener('click',()=>{syncName($id('homeEmployee')?.value);$id('attendanceInBtn')?.click()});
    $id('homePunchOut')?.addEventListener('click',()=>{syncName($id('homeEmployee')?.value);$id('attendanceOutBtn')?.click()});
    dashboard.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.open)));
    dashboard.querySelector('[data-report]')?.addEventListener('click',()=>openReport());
    $id('dashBackBtn')?.addEventListener('click',showHome);
    updateHome();setInterval(updateHome,1000);
  }

  function hidePanels(){panels.forEach(id=>{const el=$id(id);if(el)el.classList.add('app-panel-hidden')});}
  function openPanel(id){
    if(id==='activeCard'&&!(typeof active!=='undefined'&&active))return typeof toast==='function'&&toast('Chưa có ca đang hoạt động');
    hidePanels();
    dashboard?.classList.add('dashboard-hidden');backBar?.classList.remove('dashboard-hidden');
    const el=$id(id);if(el){el.classList.remove('app-panel-hidden');el.classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});}
  }
  function showHome(){hidePanels();dashboard?.classList.remove('dashboard-hidden');backBar?.classList.add('dashboard-hidden');window.scrollTo({top:0,behavior:'smooth'});updateHome()}
  function openReport(){
    openPanel('managerSection');
    setTimeout(()=>{
      const exportSection=$id('managerExportSection');
      if(exportSection&&!exportSection.closest('.hidden'))exportSection.scrollIntoView({behavior:'smooth',block:'start'});
    },250);
  }

  function updateHome(){
    const d=new Date();
    const date=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(d);
    const dt=$id('homeDateText');if(dt)dt.textContent=date;
    const preview=$id('attendancePreview');const late=$id('homeLateText');
    if(late&&preview){
      const t=preview.textContent||'';
      const m=t.match(/Trễ\s+(\d+)\s+phút/i);
      late.textContent=m?`${m[1]} phút`:(/Đúng giờ/i.test(t)?'Đúng giờ':'—');
    }
    const activeTile=$id('homeActiveTile');if(activeTile)activeTile.disabled=!(typeof active!=='undefined'&&active);
  }

  function boot(){build()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

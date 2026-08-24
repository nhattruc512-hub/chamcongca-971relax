// Restrict staff data changes to devices that actually joined the active shift, or an unlocked manager.
(function(){
  const protectedSelectors=[
    '#addRevenueBtn','#addDebtBtn',
    '[data-active-revenue-delete]','[data-outside-revenue-delete]',
    '[data-debt-add]','[data-debt-delete]','[data-debt-edit-initial]','[data-debt-edit-addition]'
  ].join(',');

  function hasManagerAccess(){return typeof managerPin!=='undefined'&&!!String(managerPin||'').trim()}
  function hasShiftAccess(){return typeof active!=='undefined'&&!!active&&typeof isOwner==='function'&&isOwner()}
  window.canEnterStaffData=function(){return hasManagerAccess()||hasShiftAccess()}
  window.requireStaffDataAccess=function(){
    if(window.canEnterStaffData())return true;
    toast(active?'Chỉ nhân viên đang trong ca mới được nhập hoặc chỉnh số liệu':'Ngoài ca không được nhập số liệu. Chỉ Quản lý được phép thao tác.');
    return false;
  }

  function updateUI(){
    const allowed=window.canEnterStaffData();
    ['qTransfer','qCash','qCourt','qWater','qOnline','debtCustomer','debtReason','debtAmount','addRevenueBtn','addDebtBtn'].forEach(id=>{
      const el=document.getElementById(id);if(el)el.disabled=!allowed;
    });
    const badge=document.getElementById('revenueMode');
    if(badge&&!allowed)badge.textContent=active?'CHỈ NGƯỜI TRONG CA ĐƯỢC NHẬP':'NGOÀI CA · ĐÃ KHÓA';
    const card=document.getElementById('quickRevenueCard');
    if(card){
      let n=document.getElementById('staffDataLockNotice');
      if(!allowed){
        if(!n){n=document.createElement('div');n.id='staffDataLockNotice';n.className='notice';const grid=card.querySelector('.money-grid');if(grid)card.insertBefore(n,grid);else card.appendChild(n)}
        n.textContent=active?'🔒 Chỉ thiết bị của nhân viên đang trong ca mới được nhập số liệu. Quản lý vẫn có thể mở quyền để thao tác.':'🔒 Hiện không có ca hoạt động. Nhân viên không được nhập số liệu ngoài ca; chỉ Quản lý được phép.';
      }else if(n)n.remove();
    }
  }

  document.addEventListener('click',e=>{
    const target=e.target.closest?.(protectedSelectors);
    if(!target||window.canEnterStaffData())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    window.requireStaffDataAccess();
  },true);

  function boot(){updateUI();setInterval(updateUI,500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

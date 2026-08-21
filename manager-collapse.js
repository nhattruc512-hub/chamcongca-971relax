(function(){
  function boot(){
    const btn=document.getElementById('auditCollapseBtn');
    const body=document.getElementById('auditCollapseBody');
    if(!btn||!body)return;
    let collapsed=false;
    btn.addEventListener('click',()=>{
      collapsed=!collapsed;
      body.classList.toggle('hidden',collapsed);
      btn.textContent=collapsed?'MỞ RỘNG':'THU GỌN';
      btn.setAttribute('aria-expanded',String(!collapsed));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

// Collapse/expand customer debt history while keeping debt entry form and total visible.
(function(){
  function mount(){
    const section=document.getElementById('debtSection');
    const list=document.getElementById('debtList');
    const empty=document.getElementById('debtEmpty');
    const head=section?.querySelector('.head');
    if(!section||!list||!empty||!head||document.getElementById('debtCollapseBtn'))return;

    const right=head.querySelector('.right');
    if(!right)return;
    const controls=document.createElement('div');
    controls.style.cssText='display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end';
    right.parentNode.insertBefore(controls,right);
    controls.appendChild(right);

    const btn=document.createElement('button');
    btn.id='debtCollapseBtn';
    btn.type='button';
    btn.className='btn subtle mini';
    btn.textContent='THU GỌN';
    btn.setAttribute('aria-expanded','true');
    controls.appendChild(btn);

    const body=document.createElement('div');
    body.id='debtHistoryBody';
    list.parentNode.insertBefore(body,list);
    body.appendChild(list);
    body.appendChild(empty);

    btn.onclick=()=>{
      const collapsed=body.classList.toggle('hidden');
      btn.textContent=collapsed?'MỞ RỘNG':'THU GỌN';
      btn.setAttribute('aria-expanded',collapsed?'false':'true');
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

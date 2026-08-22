(function(){
  function mount(){
    const list=document.getElementById('activeEntries');
    const empty=document.getElementById('activeEntriesEmpty');
    if(!list||!empty)return;
    const section=list.closest('.section-gap');
    if(!section||document.getElementById('shiftEntriesCollapseBtn'))return;
    const kicker=section.querySelector('.kicker');
    if(!kicker)return;
    const head=document.createElement('div');
    head.className='head compact';
    const holder=document.createElement('div');
    kicker.parentNode.insertBefore(head,kicker);
    holder.appendChild(kicker);
    head.appendChild(holder);
    const btn=document.createElement('button');
    btn.id='shiftEntriesCollapseBtn';
    btn.type='button';
    btn.className='btn ghost mini';
    btn.textContent='THU GỌN';
    btn.setAttribute('aria-expanded','true');
    head.appendChild(btn);
    const body=document.createElement('div');
    body.id='shiftEntriesCollapseBody';
    list.parentNode.insertBefore(body,list);
    body.appendChild(list);
    body.appendChild(empty);
    btn.onclick=()=>{
      const open=btn.getAttribute('aria-expanded')==='true';
      btn.setAttribute('aria-expanded',String(!open));
      btn.textContent=open?'MỞ RỘNG':'THU GỌN';
      body.classList.toggle('hidden',open);
    };
  }
  function boot(){mount();setInterval(mount,1500)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

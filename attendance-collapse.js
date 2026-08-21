(function(){
  const el=id=>document.getElementById(id);
  function mount(){
    const head=document.querySelector('#attendanceSection .subsection-head');
    const list=el('attendanceList'),empty=el('attendanceEmpty');
    if(!head||!list||!empty||el('attendanceHistoryToggle'))return;

    const controls=document.createElement('div');
    controls.style.cssText='display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end';
    const date=el('attendanceDate');
    if(date&&date.parentNode===head){
      head.removeChild(date);
      controls.appendChild(date);
    }
    const btn=document.createElement('button');
    btn.id='attendanceHistoryToggle';
    btn.type='button';
    btn.className='btn subtle mini';
    btn.textContent='THU GỌN';
    btn.setAttribute('aria-expanded','true');
    controls.appendChild(btn);
    head.appendChild(controls);

    const body=document.createElement('div');
    body.id='attendanceHistoryBody';
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

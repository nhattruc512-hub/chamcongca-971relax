// Show a complete per-shift revenue closeout after a shift ends and in shift history.
(function(){
  function fullShiftSummary(r){
    const transfer=Number(r?.transfer||0),cash=Number(r?.cash||0),court=Number(r?.court_revenue||0),water=Number(r?.water_revenue||0),online=Number(r?.online_revenue||0);
    const collected=transfer+cash+online;
    const revenue=court+water;
    const diff=collected-revenue;
    return {transfer,cash,court,water,online,collected,revenue,diff};
  }

  const oldRenderHistory=typeof renderHistory==='function'?renderHistory:null;
  if(oldRenderHistory){
    renderHistory=function(){
      const shift=$('historyShift').value;
      const list=(historyRows||[]).filter(r=>shift==='all'||r.shift_key===shift);
      $('historyEmpty').classList.toggle('hidden',list.length>0);
      $('historyList').innerHTML=list.map(r=>{
        const s=fullShiftSummary(r);
        return `<div class="row"><div class="row-main"><b>${esc(r.shift_name)} · ${esc(r.employee)}</b><span>${vnTime(r.start_at)} → ${vnTime(r.end_at)}</span><small>CK ${money(s.transfer)} · TM ${money(s.cash)}</small><small>Sân ${money(s.court)} · Nước ${money(s.water)} · Lịch Oline ${money(s.online)}</small><small><b>Tổng thu ${money(s.collected)} · Tổng doanh thu ${money(s.revenue)} · Chênh lệch ${money(s.diff)}</b></small></div></div>`;
      }).join('');
    };
  }

  const oldFinish=typeof finishShift==='function'?finishShift:null;
  if(oldFinish){
    finishShift=async function(){if(!active||!isOwner())return toast('Chỉ máy bắt đầu ca mới được kết thúc');if(!confirm(`Kết thúc ${active.shiftName} của ${active.employee}?`))return;try{const current={...active};const o=owner();const d=await activeApi({action:'finish',id:active.id,token:o.token,note:''});const r=d.completed||{};const s=fullShiftSummary(r);localStorage.removeItem(OWNER_KEY);active=null;renderActive();await refreshAll();alert(`ĐÃ CHỐT ${r.shift_name||current.shiftName}\n\nChuyển khoản: ${money(s.transfer)}\nTiền mặt: ${money(s.cash)}\nLịch Oline: ${money(s.online)}\nDoanh thu sân: ${money(s.court)}\nDoanh thu nước: ${money(s.water)}\n\nTổng tiền thu: ${money(s.collected)}\nTổng doanh thu: ${money(s.revenue)}\nChênh lệch: ${money(s.diff)}`)}catch(e){toast(e.message||'Không kết thúc được ca')}};
  }

  function loadFeature(src,key){if(document.querySelector(`script[data-feature="${key}"]`))return;const s=document.createElement('script');s.src=src;s.dataset.feature=key;document.body.appendChild(s)}
  loadFeature('./attendance-collapse.js?v=32','attendance-collapse');
  loadFeature('./debt-edit.js?v=32','debt-edit');
  loadFeature('./shift-entries-collapse.js?v=32','shift-entries-collapse');
  loadFeature('./online-revenue.js?v=32','online-revenue');
})();

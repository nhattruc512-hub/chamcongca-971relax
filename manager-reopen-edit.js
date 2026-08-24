// Manager: reopen a completed shift, edit mistaken revenue entries, and close it again.
(function(){
  const DELETE_ACTIVE_ENDPOINT='https://dinqlgaveujdeyisgpty.supabase.co/functions/v1/delete-active-revenue-entry';
  let currentActive=null;

  function ensureOnlineStats(){
    const activeGrid=document.getElementById('activeStats');
    if(activeGrid&&!document.getElementById('aOnline')){
      const box=document.createElement('div');box.className='stat';box.innerHTML='<span>Lịch Oline</span><b id="aOnline">0 ₫</b>';activeGrid.appendChild(box);
    }
    const revenueCard=document.getElementById('sTransfer')?.closest('.card');
    const firstGrid=revenueCard?.querySelector('.grid');
    if(firstGrid&&!document.getElementById('sOnline')){
      const box=document.createElement('div');box.className='stat';box.innerHTML='<span>Lịch Oline</span><b id="sOnline">0 ₫</b>';firstGrid.appendChild(box);
    }
  }

  function values(e){return {
    transfer:Number(e?.transfer||0),cash:Number(e?.cash||0),court:Number(e?.courtRevenue||0),water:Number(e?.waterRevenue||0),online:Number(e?.onlineRevenue||0)
  }}
  function entryText(e){const v=values(e);const p=[];if(v.transfer)p.push(`CK ${money(v.transfer)}`);if(v.cash)p.push(`TM ${money(v.cash)}`);if(v.online)p.push(`Lịch Oline ${money(v.online)}`);if(v.court)p.push(`Sân ${money(v.court)}`);if(v.water)p.push(`Nước ${money(v.water)}`);return p.join(' · ')||'0 ₫'}
  function readAmount(label,current){const raw=prompt(`${label}:`,String(Number(current||0)));if(raw===null)return null;const digits=String(raw).replace(/[^0-9]/g,'');return digits?Number(digits):0}

  renderActive=function(a){
    currentActive=a||null;ensureOnlineStats();
    const on=!!a;$('activeBadge').classList.toggle('hidden',!on);$('activeStats').classList.toggle('hidden',!on);$('closeActiveBtn').classList.toggle('hidden',!on);
    $('activeTitle').textContent=on?`${a.shift_name} · ${a.employee}`:'Không có ca đang hoạt động';
    $('activeMeta').textContent=on?`${a.scheduled_time||''} · bắt đầu ${vnTime(a.start_at)}`:'';
    if(!on){$('activeEntries').innerHTML='';return}
    const t=a.totals||{};
    $('aTransfer').textContent=money(t.transfer);$('aCash').textContent=money(t.cash);$('aCourt').textContent=money(t.courtRevenue);$('aWater').textContent=money(t.waterRevenue);if($('aOnline'))$('aOnline').textContent=money(t.onlineRevenue);
    const entries=Array.isArray(a.entries)?a.entries:[];
    $('activeEntries').innerHTML=entries.length?`<div class="kicker" style="margin-top:14px">DIỄN BIẾN CA · CÓ THỂ CHỈNH</div>`+entries.map(e=>`<div class="row"><div class="row-main"><b>${esc(vnTime(e.at))} · ${esc(e.employee||a.employee)}</b><span>${esc(entryText(e))}</span></div><div class="actions"><button class="btn" type="button" onclick="editActiveRevenue('${esc(e.id)}')">CHỈNH</button><button class="btn danger" type="button" onclick="deleteActiveRevenueManager('${esc(e.id)}')">XÓA</button></div></div>`).join(''):'';
    $('closeActiveBtn').dataset.id=a.id;
  };

  renderRevenue=function(date,hist,outside,a){
    ensureOnlineStats();let transfer=0,cash=0,court=0,water=0,online=0;
    for(const r of hist){transfer+=+r.transfer||0;cash+=+r.cash||0;court+=+r.court_revenue||0;water+=+r.water_revenue||0;online+=+r.online_revenue||0}
    for(const r of outside){transfer+=+r.transfer||0;cash+=+r.cash||0;court+=+r.court_revenue||0;water+=+r.water_revenue||0;online+=+r.online_revenue||0}
    if(a&&String(a.date_key)===date){const t=a.totals||{};transfer+=+t.transfer||0;cash+=+t.cash||0;court+=+t.courtRevenue||0;water+=+t.waterRevenue||0;online+=+t.onlineRevenue||0}
    $('sTransfer').textContent=money(transfer);$('sCash').textContent=money(cash);$('sCourt').textContent=money(court);$('sWater').textContent=money(water);if($('sOnline'))$('sOnline').textContent=money(online);
    const collected=transfer+cash+online,revenue=court+water;$('sCollected').textContent=money(collected);$('sRevenue').textContent=money(revenue);$('sDiff').textContent=money(collected-revenue);
  };

  renderHistory=function(rows){
    $('historyEmpty').classList.toggle('hidden',rows.length>0);
    $('historyList').innerHTML=rows.map(r=>{const transfer=Number(r.transfer||0),cash=Number(r.cash||0),online=Number(r.online_revenue||0),court=Number(r.court_revenue||0),water=Number(r.water_revenue||0),collected=transfer+cash+online,revenue=court+water,diff=collected-revenue;return `<div class="row"><div class="row-main"><b>${esc(r.shift_name)} · ${esc(r.employee)}</b><span>${vnTime(r.start_at)} → ${vnTime(r.end_at)}</span><small>Chuyển khoản ${money(transfer)} · Tiền mặt ${money(cash)} · Lịch Oline ${money(online)}</small><small>Doanh thu sân ${money(court)} · Doanh thu nước ${money(water)}</small><small><b>Tổng thu ${money(collected)} · Tổng doanh thu ${money(revenue)} · Chênh lệch ${money(diff)}</b></small></div><div class="actions"><button class="btn primary" type="button" onclick="reopenShift('${esc(r.id)}')">MỞ LẠI CA</button><button class="btn danger" type="button" onclick="deleteShift('${esc(r.id)}')">Xóa</button></div></div>`}).join('');
  };

  async function reopenShift(id){
    if(!confirm('Mở lại ca này để chỉnh doanh thu?\n\nCa sẽ trở lại trạng thái ĐANG HOẠT ĐỘNG. Sau khi chỉnh xong hãy bấm ĐÓNG CA ĐANG LÀM.'))return;
    try{await manager('reopen_shift',id);toast('Đã mở lại ca. Bạn có thể chỉnh doanh thu.');await refreshAll()}catch(e){toast(e.message||'Không mở lại được ca')}
  }

  async function editActiveRevenue(entryId){
    const a=currentActive;if(!a)return toast('Không có ca đang hoạt động');const e=(a.entries||[]).find(x=>String(x.id)===String(entryId));if(!e)return toast('Không tìm thấy lần nhập');const v=values(e);
    const transfer=readAmount('Chuyển khoản',v.transfer);if(transfer===null)return;
    const cash=readAmount('Tiền mặt',v.cash);if(cash===null)return;
    const online=readAmount('Lịch Oline',v.online);if(online===null)return;
    const court=readAmount('Doanh thu sân',v.court);if(court===null)return;
    const water=readAmount('Doanh thu nước',v.water);if(water===null)return;
    const collected=transfer+cash+online,revenue=court+water;
    if(!confirm(`Lưu lại lần nhập này?\n\nChuyển khoản: ${money(transfer)}\nTiền mặt: ${money(cash)}\nLịch Oline: ${money(online)}\nDoanh thu sân: ${money(court)}\nDoanh thu nước: ${money(water)}\n\nTổng thu: ${money(collected)}\nTổng doanh thu: ${money(revenue)}`))return;
    try{await manager('update_active_entry',a.id,{entryId,transfer,cash,online,court,water});toast('Đã chỉnh doanh thu');await refreshAll()}catch(err){toast(err.message||'Không chỉnh được doanh thu')}
  }

  async function deleteActiveRevenueManager(entryId){
    const a=currentActive;if(!a)return;const e=(a.entries||[]).find(x=>String(x.id)===String(entryId));if(!e)return;if(!confirm(`Xóa toàn bộ lần nhập này?\n${entryText(e)}`))return;
    try{const r=await fetch(DELETE_ACTIVE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entryId,pin})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Không xóa được lần nhập');toast('Đã xóa lần nhập');await refreshAll()}catch(err){toast(err.message||'Không xóa được lần nhập')}
  }

  window.reopenShift=reopenShift;window.editActiveRevenue=editActiveRevenue;window.deleteActiveRevenueManager=deleteActiveRevenueManager;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureOnlineStats);else ensureOnlineStats();
})();

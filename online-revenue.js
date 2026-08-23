// Separate Lịch Online revenue category for staff revenue entry, live shift totals and daily summary.
(function(){
  function mountFields(){
    const grid=document.querySelector('#quickRevenueCard .money-grid');
    if(grid&&!$('qOnline')){
      const label=document.createElement('label');
      label.innerHTML='<span>Lịch Online</span><input id="qOnline" class="input money" inputmode="numeric" placeholder="0">';
      grid.appendChild(label);
      const input=label.querySelector('input');
      if(input)input.addEventListener('blur',()=>fmtInput(input));
    }
    const liveGrid=$('activeCard')?.querySelector('.summary-grid');
    if(liveGrid&&!$('liveOnline')){
      const box=document.createElement('div');box.innerHTML='<span>Lịch Online</span><b id="liveOnline">0 ₫</b>';liveGrid.appendChild(box);
    }
    const sumGrid=$('summarySection')?.querySelector('.summary-grid');
    if(sumGrid&&!$('sumOnline')){
      const box=document.createElement('div');box.innerHTML='<span>Lịch Online</span><b id="sumOnline">0 ₫</b>';sumGrid.appendChild(box);
    }
  }

  const previousRenderActive=typeof renderActive==='function'?renderActive:null;
  if(previousRenderActive){
    renderActive=function(){
      previousRenderActive();
      mountFields();
      if(!active)return;
      const t=active.totals||{};
      const transfer=Number(t.transfer||0),cash=Number(t.cash||0),court=Number(t.courtRevenue||0),water=Number(t.waterRevenue||0),online=Number(t.onlineRevenue||0);
      if($('liveOnline'))$('liveOnline').textContent=money(online);
      if($('liveRevenue'))$('liveRevenue').textContent=money(court+water+online);
      if($('liveDiff'))$('liveDiff').textContent=money(transfer+cash-court-water-online);
    };
  }

  addRevenue=async function(){
    mountFields();
    const transfer=parseMoney($('qTransfer').value),cash=parseMoney($('qCash').value),courtRevenue=parseMoney($('qCourt').value),waterRevenue=parseMoney($('qWater').value),onlineRevenue=parseMoney($('qOnline')?.value||'');
    if(!(transfer||cash||courtRevenue||waterRevenue||onlineRevenue))return toast('Hãy nhập ít nhất một khoản tiền');
    const employee=currentEmployee();rememberEmployee(employee);$('addRevenueBtn').disabled=true;
    try{
      const d=await activeApi({action:'public_add_entry',entry:{id:crypto.randomUUID(),employee,transfer,cash,courtRevenue,waterRevenue,onlineRevenue}});
      if(d.active){active=rowToActive(d.active);renderActive();toast(`Đã cộng vào ${active.shiftName}`)}
      else{
        const now=new Date();
        await rest('staff_revenue_entries',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({date_key:localDateKey(now),employee,transfer,cash,court_revenue:courtRevenue,water_revenue:waterRevenue,online_revenue:onlineRevenue,shift_name:'Ngoài ca',source:'manual'})});
        toast('Đã lưu doanh thu ngoài ca');
      }
      ['qTransfer','qCash','qCourt','qWater','qOnline'].forEach(id=>{if($(id))$(id).value=''});
      await refreshSummary();
    }catch(e){console.error(e);toast('Không lưu được doanh thu')}finally{$('addRevenueBtn').disabled=false}
  };

  refreshSummary=async function(){
    mountFields();
    const date=$('summaryDate').value||localDateKey();
    try{
      const [hist,outside,act]=await Promise.all([
        rest(`staff_shift_history?select=transfer,cash,court_revenue,water_revenue,online_revenue&date_key=eq.${encodeURIComponent(date)}`),
        rest(`staff_revenue_entries?select=transfer,cash,court_revenue,water_revenue,online_revenue&date_key=eq.${encodeURIComponent(date)}`),
        rest('staff_active_shift?select=date_key,totals&singleton_id=eq.1')
      ]);
      const sum={transfer:0,cash:0,court:0,water:0,online:0};
      (hist||[]).forEach(r=>{sum.transfer+=+r.transfer||0;sum.cash+=+r.cash||0;sum.court+=+r.court_revenue||0;sum.water+=+r.water_revenue||0;sum.online+=+r.online_revenue||0});
      (outside||[]).forEach(r=>{sum.transfer+=+r.transfer||0;sum.cash+=+r.cash||0;sum.court+=+r.court_revenue||0;sum.water+=+r.water_revenue||0;sum.online+=+r.online_revenue||0});
      const ar=act?.[0];if(ar&&ar.date_key===date){const t=ar.totals||{};sum.transfer+=+t.transfer||0;sum.cash+=+t.cash||0;sum.court+=+t.courtRevenue||0;sum.water+=+t.waterRevenue||0;sum.online+=+t.onlineRevenue||0}
      $('sumTransfer').textContent=money(sum.transfer);$('sumCash').textContent=money(sum.cash);$('sumCourt').textContent=money(sum.court);$('sumWater').textContent=money(sum.water);if($('sumOnline'))$('sumOnline').textContent=money(sum.online);$('sumRevenue').textContent=money(sum.court+sum.water+sum.online);
    }catch(e){console.error(e)}
  };

  function boot(){mountFields();if(active)renderActive();refreshSummary()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

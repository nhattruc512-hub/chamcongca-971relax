// Manager view: show complete totals for every completed shift and export debts.
(function(){
  if(typeof renderHistory==='function'){
    renderHistory=function(rows){
      $('historyEmpty').classList.toggle('hidden',rows.length>0);
      $('historyList').innerHTML=rows.map(r=>{
        const transfer=Number(r.transfer||0),cash=Number(r.cash||0),court=Number(r.court_revenue||0),water=Number(r.water_revenue||0);
        const collected=Number(r.collected_total||transfer+cash),revenue=Number(r.revenue_total||court+water),diff=Number(r.difference||collected-revenue);
        return `<div class="row"><div class="row-main"><b>${esc(r.shift_name)} · ${esc(r.employee)}</b><span>${vnTime(r.start_at)} → ${vnTime(r.end_at)}</span><small>Chuyển khoản ${money(transfer)} · Tiền mặt ${money(cash)}</small><small>Doanh thu sân ${money(court)} · Doanh thu nước ${money(water)}</small><small><b>Tổng thu ${money(collected)} · Tổng doanh thu ${money(revenue)} · Chênh lệch ${money(diff)}</b></small></div><div class="actions"><button class="btn danger" onclick="deleteShift('${esc(r.id)}')">Xóa</button></div></div>`;
      }).join('');
    };
  }

  function nextDate(day){
    const d=new Date(`${day}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+1);
    return d.toISOString().slice(0,10);
  }

  async function exportDebts(){
    try{
      const p=range();
      if(!p.start||!p.end)return toast('Chọn thời gian cần xuất');
      const start=encodeURIComponent(`${p.start}T00:00:00+07:00`);
      const end=encodeURIComponent(`${nextDate(p.end)}T00:00:00+07:00`);
      const rows=await rest(`customer_debts?select=*&created_at=gte.${start}&created_at=lt.${end}&order=created_at.asc`);
      if(!rows?.length)return toast('Không có công nợ trong thời gian đã chọn');
      const total=rows.reduce((s,r)=>s+Number(r.amount||0),0);
      const data=rows.map(r=>[
        vnDate(r.created_at),
        vnTime(r.created_at),
        r.customer||'',
        r.reason||'',
        Number(r.amount||0),
        r.employee||'',
        r.settled?'Đã thanh toán':'Đang nợ'
      ]);
      data.push(['','','TỔNG CÔNG NỢ','',total,'','']);
      csv(`971-cong-no-${p.label}.csv`,['Ngày','Giờ','Tên khách','Nội dung','Số tiền','Nhân viên','Trạng thái'],data);
      toast('Đã xuất file công nợ');
    }catch(e){
      console.error(e);toast('Không xuất được công nợ');
    }
  }

  function mountDebtExport(){
    if(document.getElementById('exportDebtBtn'))return;
    const revenueBtn=document.getElementById('exportRevenueBtn');
    if(!revenueBtn)return;
    const btn=document.createElement('button');
    btn.id='exportDebtBtn';btn.className='btn primary';btn.type='button';btn.textContent='XUẤT CÔNG NỢ';btn.onclick=exportDebts;
    revenueBtn.parentElement.appendChild(btn);
    const card=revenueBtn.closest('.card');
    const title=card?.querySelector('h2');if(title)title.textContent='Chấm công, doanh thu & công nợ';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountDebtExport);else mountDebtExport();
})();

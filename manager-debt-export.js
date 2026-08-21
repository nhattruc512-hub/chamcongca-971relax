// Export full customer debt history for the selected day/month/year.
(function(){
  function inRangeDate(iso,start,end){
    const key=localDateKey(new Date(iso));
    return key>=start&&key<=end;
  }

  async function exportDebtFullHistory(){
    try{
      const p=range();
      const [debts,history]=await Promise.all([
        rest('customer_debts?select=*&order=created_at.asc'),
        rest('customer_debt_history?select=*&order=created_at.asc')
      ]);
      const hs=Array.isArray(history)?history:[];
      const ds=Array.isArray(debts)?debts:[];
      const rows=[];

      for(const d of ds){
        const own=hs.filter(h=>String(h.debt_id)===String(d.id));
        const addedTotal=own.reduce((s,h)=>s+Number(h.amount_added||0),0);
        const initialAmount=Number(d.amount||0)-addedTotal;
        if(inRangeDate(d.created_at,p.start,p.end)){
          rows.push([
            localDateKey(new Date(d.created_at)),
            vnTime(d.created_at),
            d.customer,
            'Nợ ban đầu',
            d.reason||'',
            initialAmount,
            '',
            initialAmount,
            d.employee||'',
            d.shift_name||'Ngoài ca',
            d.settled?'Đã tất toán':'Đang nợ',
            Number(d.amount||0)
          ]);
        }
        for(const h of own){
          if(!inRangeDate(h.created_at,p.start,p.end))continue;
          rows.push([
            localDateKey(new Date(h.created_at)),
            vnTime(h.created_at),
            h.customer||d.customer,
            'Cộng thêm',
            h.reason||'',
            Number(h.amount_added||0),
            Number(h.previous_amount||0),
            Number(h.new_amount||0),
            h.employee||'',
            d.shift_name||'Ngoài ca',
            d.settled?'Đã tất toán':'Đang nợ',
            Number(d.amount||0)
          ]);
        }
      }

      rows.sort((a,b)=>`${a[0]} ${a[1]}`.localeCompare(`${b[0]} ${b[1]}`));
      if(!rows.length)return toast('Không có lịch sử công nợ trong khoảng đã chọn');

      const totalOpen=ds.filter(d=>!d.settled).reduce((s,d)=>s+Number(d.amount||0),0);
      rows.push(['','','','TỔNG CÔNG NỢ ĐANG MỞ','','','','','','','',totalOpen]);
      csv(`971-cong-no-lich-su-${p.label}.csv`,[
        'Ngày','Giờ','Khách hàng','Loại phát sinh','Nội dung nợ','Số tiền phát sinh','Nợ trước','Nợ sau','Nhân viên','Ca','Trạng thái','Tổng nợ hiện tại'
      ],rows);
      toast('Đã xuất đầy đủ lịch sử công nợ');
    }catch(e){
      console.error(e);
      toast('Không xuất được lịch sử công nợ');
    }
  }

  function mount(){
    const revenueBtn=document.getElementById('exportRevenueBtn');
    if(!revenueBtn||document.getElementById('exportDebtBtn'))return;
    const btn=document.createElement('button');
    btn.id='exportDebtBtn';
    btn.className='btn primary';
    btn.type='button';
    btn.textContent='XUẤT CÔNG NỢ';
    revenueBtn.after(btn);
    btn.onclick=exportDebtFullHistory;
  }

  window.exportDebtFullHistory=exportDebtFullHistory;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

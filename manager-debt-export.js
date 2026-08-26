// Export full customer debt history for the selected day/month/year.
(function(){
  function inRangeDate(iso,start,end){
    const key=localDateKey(new Date(iso));
    return key>=start&&key<=end;
  }

  async function exportDebtFullHistory(){
    try{
      const p=range();
      const [debts,history,edits]=await Promise.all([
        rest('customer_debts?select=*&order=created_at.asc'),
        rest('customer_debt_history?select=*&order=created_at.asc'),
        rest('customer_debt_edits?select=*&order=created_at.asc')
      ]);
      const hs=Array.isArray(history)?history:[];
      const ds=Array.isArray(debts)?debts:[];
      const es=Array.isArray(edits)?edits:[];
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
            0,
            initialAmount,
            d.employee||'',
            d.shift_name||'Ngoài ca',
            d.settled?'Đã tất toán':'Đang nợ',
            Number(d.amount||0),
            ''
          ]);
        }
        for(const h of own){
          if(!inRangeDate(h.created_at,p.start,p.end))continue;
          const editCount=es.filter(e=>String(e.history_id||'')===String(h.id)).length;
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
            Number(d.amount||0),
            editCount?`Đã chỉnh ${editCount} lần`:''
          ]);
        }
      }

      rows.sort((a,b)=>`${a[0]} ${a[1]}`.localeCompare(`${b[0]} ${b[1]}`));
      if(!rows.length)return toast('Không có lịch sử công nợ trong khoảng đã chọn');

      const totalOpen=ds.filter(d=>!d.settled).reduce((s,d)=>s+Number(d.amount||0),0);
      rows.push(['','','','TỔNG CÔNG NỢ ĐANG MỞ','','','','','','','',totalOpen,'']);
      csv(`971-cong-no-lich-su-${p.label}.csv`,[
        'Ngày','Giờ','Khách hàng','Loại phát sinh','Nội dung nợ','Số tiền phát sinh','Nợ trước','Nợ sau','Nhân viên','Ca','Trạng thái','Tổng nợ hiện tại','Ghi chú chỉnh sửa'
      ],rows);
      toast('Đã xuất đầy đủ nợ ban đầu và các lần cộng thêm');
    }catch(e){
      console.error(e);
      toast('Không xuất được lịch sử công nợ');
    }
  }

  function mount(){
    const revenueBtn=document.getElementById('exportRevenueBtn');
    if(!revenueBtn)return;
    let btn=document.getElementById('exportDebtBtn');
    if(!btn){
      btn=document.createElement('button');
      btn.id='exportDebtBtn';
      btn.className='btn primary';
      btn.type='button';
      btn.textContent='XUẤT CÔNG NỢ';
      revenueBtn.after(btn);
    }
    // Always override the older exporter loaded by manager-shift-summary.js.
    btn.onclick=exportDebtFullHistory;
  }

  window.exportDebtFullHistory=exportDebtFullHistory;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

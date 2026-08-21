// Manager debt view: mirror the detailed debt history shown on the staff page.
(function(){
  let renderSeq=0;

  function addedTotal(rows){return (rows||[]).reduce((s,h)=>s+Number(h.amount_added||0),0)}
  function debtHistoryHtml(d,rows){
    const related=(rows||[]).filter(h=>String(h.debt_id)===String(d.id));
    const initial=Math.max(0,Number(d.amount||0)-addedTotal(related));
    const initialRow=`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(d.created_at)} ${vnTime(d.created_at)}</b> · Nợ ban đầu: <b>${money(initial)}</b> · ${esc(d.reason||'')}</small></div>`;
    const added=related.map(h=>`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(h.created_at)} ${vnTime(h.created_at)}</b> · <b>+${money(h.amount_added)}</b> · ${esc(h.reason||'')}${h.employee?` · ${esc(h.employee)}`:''}</small></div>`).join('');
    return `<div style="margin-top:8px"><small style="font-weight:900;color:#586663">LỊCH SỬ CÔNG NỢ</small>${initialRow}${added}</div>`;
  }

  function draw(rows,history){
    $('debtEmpty').classList.toggle('hidden',rows.length>0);
    $('debtTotal').textContent=`Tổng đang nợ: ${money(rows.reduce((s,r)=>s+(+r.amount||0),0))}`;
    $('debtList').innerHTML=rows.map(r=>`<div class="row"><div class="row-main"><b>${esc(r.customer)} · ${money(r.amount)}</b><span>${esc(r.reason||'')} · ${esc(r.employee||'')} · ${esc(r.shift_name||'Ngoài ca')}</span><small>${vnDate(r.created_at)} ${vnTime(r.created_at)}</small>${debtHistoryHtml(r,history)}</div></div>`).join('');
  }

  renderDebts=function(rows){
    const list=Array.isArray(rows)?rows:[];
    const seq=++renderSeq;
    draw(list,[]);
    rest('customer_debt_history?select=*&order=created_at.asc').then(history=>{
      if(seq!==renderSeq)return;
      draw(list,history||[]);
    }).catch(e=>console.error(e));
  };
})();

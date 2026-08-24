// Allow staff to remove mistakenly entered revenue. Active-shift deletion requires shift staff ownership or manager PIN.
(function(){
  let outsideRows=[];
  const DELETE_ACTIVE_ENDPOINT='https://dinqlgaveujdeyisgpty.supabase.co/functions/v1/delete-active-revenue-entry';
  const oldRenderActive=renderActive;
  const CATEGORY_DEFS=[
    {key:'transfer',label:'Chuyển khoản'},
    {key:'cash',label:'Tiền mặt'},
    {key:'courtRevenue',label:'Doanh thu sân'},
    {key:'waterRevenue',label:'Doanh thu nước'},
    {key:'onlineRevenue',label:'Lịch Oline'}
  ];
  const revenueCells=e=>CATEGORY_DEFS.map(c=>[c.label,e?.[c.key]]).filter(([,v])=>Number(v));

  function mountGroupStyles(){
    if(document.getElementById('revenueGroupStyles'))return;
    const s=document.createElement('style');s.id='revenueGroupStyles';s.textContent=`
      #activeEntries{gap:12px}
      .revenue-group{overflow:hidden;border:1px solid #cfe3df;border-radius:14px;background:#fff}
      .revenue-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#eaf3f1}
      .revenue-group-head b{font-size:16px}.revenue-group-head strong{font-size:16px;white-space:nowrap}
      .revenue-group-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid #e4ecea}
      .revenue-group-info{display:grid;gap:3px}.revenue-group-info b{font-size:14px}.revenue-group-info span{font-size:12px;color:#6b7774}
      .revenue-delete-btn{white-space:nowrap}
      @media(max-width:640px){.revenue-group-head{padding:11px 12px}.revenue-group-head b,.revenue-group-head strong{font-size:15px}.revenue-group-row{padding:10px 12px}.revenue-delete-btn{font-size:10.5px;padding:7px 8px}}
    `;document.head.appendChild(s);
  }

  function applyRevenueLabels(){
    const court=$('qCourt')?.closest('label')?.querySelector('span');
    const water=$('qWater')?.closest('label')?.querySelector('span');
    if(court)court.textContent='Doanh thu sân (lịch đặt, vé social, thuê...)';
    if(water)water.textContent='Doanh thu nước (phụ kiện, bánh, kem,...)';
  }

  function renderRevenueGroups(entries){
    const groups=CATEGORY_DEFS.map(cat=>{
      const rows=entries.filter(e=>Number(e?.[cat.key]||0));
      if(!rows.length)return '';
      const total=rows.reduce((sum,e)=>sum+Number(e?.[cat.key]||0),0);
      return `<section class="revenue-group"><div class="revenue-group-head"><b>${cat.label}</b><strong>${money(total)}</strong></div><div class="revenue-group-list">${rows.map(e=>`<div class="revenue-group-row"><div class="revenue-group-info"><b>${money(e[cat.key])}</b><span>${esc(vnTime(e.at))} · ${esc(e.employee||active.employee)}</span></div><button class="btn danger mini revenue-delete-btn" type="button" data-active-revenue-delete="${esc(e.id)}">Xóa lần nhập</button></div>`).join('')}</div></section>`;
    }).filter(Boolean);
    return groups.join('');
  }

  renderActive=function(){
    oldRenderActive();
    mountGroupStyles();
    if(!active||!$('activeEntries'))return;
    const entries=active.entries||[];
    $('activeEntriesEmpty').classList.toggle('hidden',entries.length>0);
    $('activeEntries').innerHTML=renderRevenueGroups(entries);
    document.querySelectorAll('[data-active-revenue-delete]').forEach(b=>b.onclick=()=>deleteActiveRevenue(b.dataset.activeRevenueDelete));
  };

  async function callDeleteActive(entryId,payload={}){
    const r=await fetch(DELETE_ACTIVE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entryId:String(entryId),...payload})});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||`Lỗi ${r.status}`);
    return d;
  }

  async function deleteActiveRevenue(id){
    const e=(active?.entries||[]).find(x=>String(x.id)===String(id));
    if(!e)return toast('Không tìm thấy khoản doanh thu');
    const parts=revenueCells(e).map(([label,value])=>`${label} ${money(value)}`);
    let auth={};
    if(typeof isOwner==='function'&&isOwner()){
      const o=typeof owner==='function'?owner():null;
      if(!o?.token)return toast('Không xác định được quyền của nhân viên trong ca');
      auth={token:o.token};
    }else{
      const pin=prompt('Nhập PIN quản lý để xóa khoản trong ca');
      if(pin===null)return;
      if(!pin.trim())return toast('Chưa nhập PIN quản lý');
      auth={pin:pin.trim()};
    }
    if(!confirm(`Xóa lần nhập này?\n${parts.join(' · ')}\n\nCác tổng của ca sẽ tự tính lại.`))return;
    try{
      const d=await callDeleteActive(id,auth);
      active=rowToActive(d.active);renderActive();await refreshSummary();if(managerPin)refreshManager();toast('Đã xóa lần nhập và tính lại tổng');
    }catch(err){toast(err.message||'Không xóa được doanh thu')}
  }

  function mountOutsideHistory(){
    const card=$('quickRevenueCard');if(!card||$('outsideRevenueList'))return;
    const box=document.createElement('div');box.className='section-gap';box.innerHTML=`<div class="head compact"><div><div class="kicker">LỊCH SỬ DOANH THU NGOÀI CA</div><p class="muted">Nếu nhập nhầm có thể xóa tại đây.</p></div><button id="outsideRevenueRefresh" class="btn ghost mini" type="button">Làm mới</button></div><div id="outsideRevenueList" class="list"></div><div id="outsideRevenueEmpty" class="empty hidden">Chưa có khoản doanh thu ngoài ca trong ngày.</div>`;
    card.appendChild(box);$('outsideRevenueRefresh').onclick=refreshOutsideRevenue;
  }

  async function refreshOutsideRevenue(){
    if(!$('outsideRevenueList'))return;
    const date=$('summaryDate')?.value||localDateKey();
    try{
      outsideRows=await rest(`staff_revenue_entries?select=id,created_at,employee,transfer,cash,court_revenue,water_revenue,online_revenue,shift_name&date_key=eq.${encodeURIComponent(date)}&order=created_at.desc`)||[];
      $('outsideRevenueEmpty').classList.toggle('hidden',outsideRows.length>0);
      $('outsideRevenueList').innerHTML=outsideRows.map(r=>{
        const cells=[['Chuyển khoản',r.transfer],['Tiền mặt',r.cash],['Doanh thu sân',r.court_revenue],['Doanh thu nước',r.water_revenue],['Lịch Oline',r.online_revenue]].filter(([,v])=>Number(v));
        return `<div class="row"><div class="row-main"><b>${esc(vnTime(r.created_at))} · ${esc(r.employee||'Nhân viên')}</b><div class="shift-entry-grid">${cells.map(([label,value])=>`<div class="shift-entry-cell"><span>${label}</span><b>${money(value)}</b></div>`).join('')}</div></div><div class="row-actions"><button class="btn danger mini" type="button" data-outside-revenue-delete="${esc(r.id)}">Xóa</button></div></div>`;
      }).join('');
      document.querySelectorAll('[data-outside-revenue-delete]').forEach(b=>b.onclick=()=>deleteOutsideRevenue(b.dataset.outsideRevenueDelete));
    }catch(err){console.error(err)}
  }

  async function deleteOutsideRevenue(id){
    const r=outsideRows.find(x=>String(x.id)===String(id));if(!r)return;
    const p=[['Chuyển khoản',r.transfer],['Tiền mặt',r.cash],['Doanh thu sân',r.court_revenue],['Doanh thu nước',r.water_revenue],['Lịch Oline',r.online_revenue]].filter(([,v])=>Number(v)).map(([label,value])=>`${label} ${money(value)}`);
    if(!confirm(`Xóa khoản doanh thu ngoài ca đã nhập nhầm?\n${p.join(' · ')}`))return;
    try{await activeApi({action:'delete_outside_entry',id:String(id)});await Promise.all([refreshOutsideRevenue(),refreshSummary()]);if(managerPin)refreshManager();toast('Đã xóa khoản doanh thu ngoài ca')}catch(err){toast(err.message||'Không xóa được doanh thu')}
  }

  const oldAddRevenue=addRevenue;
  addRevenue=async function(){await oldAddRevenue();setTimeout(refreshOutsideRevenue,150)};
  const oldRefreshSummary=refreshSummary;
  refreshSummary=async function(){await oldRefreshSummary();if($('outsideRevenueList'))refreshOutsideRevenue()};

  function bootDelete(){mountGroupStyles();applyRevenueLabels();mountOutsideHistory();refreshOutsideRevenue();if(active)renderActive()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootDelete);else bootDelete();
})();

// Customer debt editing: staff can add more debt to an existing customer record.
(function(){
  function renderDebtEditor(){
    if(!$('debtList'))return;
    const total=debtRows.reduce((a,x)=>a+Number(x.amount||0),0);
    $('debtTotal').textContent=money(total);
    $('debtEmpty').classList.toggle('hidden',debtRows.length>0);
    $('debtList').innerHTML=debtRows.map(d=>`<div class="row"><div class="row-main"><b>${esc(d.customer)} · ${money(d.amount)}</b><span>${esc(d.reason)} · ${esc(d.employee||'')} · ${esc(d.shift_name||'Ngoài ca')}</span><small>${vnDate(d.created_at)} ${vnTime(d.created_at)}</small></div><div class="row-actions"><button class="btn secondary mini" type="button" data-debt-add="${esc(d.id)}">+ Cộng thêm nợ</button><button class="btn danger mini" type="button" data-debt-delete="${esc(d.id)}">Xóa</button></div></div>`).join('');
    document.querySelectorAll('[data-debt-add]').forEach(b=>b.onclick=()=>addMoreDebt(b.dataset.debtAdd));
    document.querySelectorAll('[data-debt-delete]').forEach(b=>b.onclick=()=>deleteDebt(b.dataset.debtDelete));
  }

  async function addMoreDebt(id){
    const d=debtRows.find(x=>String(x.id)===String(id));
    if(!d)return toast('Không tìm thấy khách nợ');
    const raw=prompt(`Cộng thêm tiền nợ cho ${d.customer}\nĐang nợ: ${money(d.amount)}\n\nNhập số tiền muốn cộng thêm:`);
    if(raw===null)return;
    const extra=parseMoney(raw);
    if(!extra)return toast('Số tiền cộng thêm không hợp lệ');
    const next=Number(d.amount||0)+extra;
    if(!confirm(`${d.customer}\n${money(d.amount)} + ${money(extra)} = ${money(next)}\n\nXác nhận cập nhật công nợ?`))return;
    try{
      await rest(`customer_debts?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({amount:next})});
      await refreshDebts();
      toast(`Đã cộng thêm ${money(extra)} cho ${d.customer}`);
    }catch(e){console.error(e);toast('Không cập nhật được công nợ')}
  }

  renderDebts=function(){renderDebtEditor()};
  window.addMoreDebt=addMoreDebt;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(debtRows?.length)renderDebtEditor()});else if(debtRows?.length)renderDebtEditor();
})();

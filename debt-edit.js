(function(){
  let debtHistory=[];
  let debtEdits=[];
  const expandedDebts=new Set();

  function historyFor(id){return debtHistory.filter(h=>String(h.debt_id)===String(id));}
  function editsForDebt(id){return debtEdits.filter(e=>String(e.debt_id)===String(id));}
  function editsForAddition(id){return debtEdits.filter(e=>String(e.history_id||'')===String(id));}

  function editTrail(rows){
    if(!rows.length)return '';
    return rows.map(e=>`<div style="margin-top:5px;padding:6px 8px;border-left:3px solid #d7e4e1;background:#fbfcfc;border-radius:7px"><small><b>Đã chỉnh ${vnDate(e.created_at)} ${vnTime(e.created_at)}</b>${e.employee?` · ${esc(e.employee)}`:''}<br>${esc(e.old_reason||'')} · ${money(e.old_amount)} → ${esc(e.new_reason||'')} · ${money(e.new_amount)}</small></div>`).join('');
  }

  function renderHistory(d){
    const rows=historyFor(d.id);
    const additions=rows.reduce((s,h)=>s+Number(h.amount_added||0),0);
    const initialAmount=Number(d.amount||0)-additions;
    const initialEdits=editsForDebt(d.id).filter(e=>e.target_type==='initial');
    const initial=`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(d.created_at)} ${vnTime(d.created_at)}</b> · Nợ ban đầu: <b>${money(initialAmount)}</b> · ${esc(d.reason||'')}</small><div style="margin-top:6px"><button class="btn secondary mini" type="button" data-debt-edit-initial="${esc(d.id)}">Chỉnh nợ ban đầu</button></div>${editTrail(initialEdits)}</div>`;
    const added=rows.map(h=>`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(h.created_at)} ${vnTime(h.created_at)}</b> · <b>+${money(h.amount_added)}</b> · ${esc(h.reason||'')} ${h.employee?`· ${esc(h.employee)}`:''}</small><div style="margin-top:6px"><button class="btn secondary mini" type="button" data-debt-edit-addition="${esc(h.id)}">Chỉnh khoản này</button></div>${editTrail(editsForAddition(h.id))}</div>`).join('');
    return `<div data-debt-history-body="${esc(d.id)}" class="${expandedDebts.has(String(d.id))?'':'hidden'}" style="margin-top:8px"><small style="font-weight:900;color:#586663">LỊCH SỬ CÔNG NỢ</small>${initial}${added}</div>`;
  }

  function renderDebtActions(){
    if(!document.getElementById('debtList'))return;
    const total=debtRows.reduce((a,x)=>a+Number(x.amount||0),0);
    document.getElementById('debtTotal').textContent=money(total);
    document.getElementById('debtEmpty').classList.toggle('hidden',debtRows.length>0);
    document.getElementById('debtList').innerHTML=debtRows.map(d=>{
      const open=expandedDebts.has(String(d.id));
      return `<div class="row"><div class="row-main"><b>${esc(d.customer)} · ${money(d.amount)}</b><span>${esc(d.reason)} · ${esc(d.employee||'')} · ${esc(d.shift_name||'Ngoài ca')}</span><small>${vnDate(d.created_at)} ${vnTime(d.created_at)}</small>${renderHistory(d)}</div><div class="row-actions"><button class="btn subtle mini" type="button" data-debt-toggle="${esc(d.id)}" aria-expanded="${open?'true':'false'}">${open?'THU GỌN':'MỞ RỘNG'}</button><button class="btn secondary mini" type="button" data-debt-add="${esc(d.id)}">+ Cộng thêm nợ</button><button class="btn danger mini" type="button" data-debt-delete="${esc(d.id)}">Xóa</button></div></div>`;
    }).join('');
    document.querySelectorAll('[data-debt-toggle]').forEach(b=>b.onclick=()=>toggleDebt(b.dataset.debtToggle));
    document.querySelectorAll('[data-debt-add]').forEach(b=>b.onclick=()=>addMoreDebt(b.dataset.debtAdd));
    document.querySelectorAll('[data-debt-edit-initial]').forEach(b=>b.onclick=()=>editInitialDebt(b.dataset.debtEditInitial));
    document.querySelectorAll('[data-debt-edit-addition]').forEach(b=>b.onclick=()=>editAddition(b.dataset.debtEditAddition));
    document.querySelectorAll('[data-debt-delete]').forEach(b=>b.onclick=()=>deleteDebt(b.dataset.debtDelete));
  }

  function toggleDebt(id){
    id=String(id);
    if(expandedDebts.has(id))expandedDebts.delete(id);else expandedDebts.add(id);
    renderDebtActions();
  }

  async function loadDebtExtras(){
    try{
      [debtHistory,debtEdits]=await Promise.all([
        rest('customer_debt_history?select=*&order=created_at.asc'),
        rest('customer_debt_edits?select=*&order=created_at.asc')
      ]);
      debtHistory=debtHistory||[];debtEdits=debtEdits||[];
    }catch(e){console.error(e);debtHistory=[];debtEdits=[];}
  }

  async function addMoreDebt(id){
    const d=debtRows.find(x=>String(x.id)===String(id));
    if(!d)return toast('Không tìm thấy khách nợ');
    const reason=prompt(`Cộng thêm nợ cho ${d.customer}\nĐang nợ: ${money(d.amount)}\n\nKhách nợ thêm khoản gì?`);
    if(reason===null)return;if(!reason.trim())return toast('Nhập nội dung khách nợ gì');
    const raw=prompt(`Nội dung: ${reason.trim()}\n\nNhập số tiền cộng thêm:`);
    if(raw===null)return;const extra=parseMoney(raw);if(!extra)return toast('Số tiền cộng thêm không hợp lệ');
    const next=Number(d.amount||0)+extra,employee=currentEmployee();
    if(!confirm(`${d.customer}\nNợ thêm: ${reason.trim()}\nSố tiền: +${money(extra)}\nTổng mới: ${money(next)}\n\nXác nhận lưu công nợ?`))return;
    try{
      await rest('rpc/add_customer_debt_amount',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_debt_id:String(id),p_reason:reason.trim(),p_amount:extra,p_employee:employee})});
      expandedDebts.add(String(id));
      await refreshDebts();toast(`Đã cộng ${money(extra)} · ${reason.trim()}`);
    }catch(e){console.error(e);toast('Không cập nhật được công nợ');}
  }

  async function editInitialDebt(id){
    const d=debtRows.find(x=>String(x.id)===String(id));if(!d)return toast('Không tìm thấy khách nợ');
    const rows=historyFor(id),additions=rows.reduce((s,h)=>s+Number(h.amount_added||0),0),initial=Number(d.amount||0)-additions;
    const reason=prompt(`Chỉnh nợ ban đầu của ${d.customer}\n\nNội dung hiện tại: ${d.reason||''}\nNhập nội dung đúng:`,d.reason||'');
    if(reason===null)return;if(!reason.trim())return toast('Nội dung không được để trống');
    const raw=prompt(`Số tiền nợ ban đầu hiện tại: ${money(initial)}\nNhập số tiền đúng:`,String(initial));
    if(raw===null)return;const amount=parseMoney(raw);if(!amount)return toast('Số tiền không hợp lệ');
    if(reason.trim()===String(d.reason||'').trim()&&amount===initial)return toast('Không có thay đổi');
    if(!confirm(`Xác nhận chỉnh nợ ban đầu?\n\nTrước: ${d.reason} · ${money(initial)}\nSau: ${reason.trim()} · ${money(amount)}\n\nTổng công nợ sẽ tự tính lại.`))return;
    try{
      await rest('rpc/edit_customer_debt_initial',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_debt_id:String(id),p_reason:reason.trim(),p_amount:amount,p_employee:currentEmployee()})});
      expandedDebts.add(String(id));
      await refreshDebts();toast('Đã chỉnh nợ ban đầu và lưu lịch sử');
    }catch(e){console.error(e);toast('Không chỉnh được công nợ');}
  }

  async function editAddition(historyId){
    const h=debtHistory.find(x=>String(x.id)===String(historyId));if(!h)return toast('Không tìm thấy khoản nợ');
    const reason=prompt(`Chỉnh khoản cộng thêm\n\nNội dung hiện tại: ${h.reason||''}\nNhập nội dung đúng:`,h.reason||'');
    if(reason===null)return;if(!reason.trim())return toast('Nội dung không được để trống');
    const raw=prompt(`Số tiền hiện tại: ${money(h.amount_added)}\nNhập số tiền đúng:`,String(h.amount_added||0));
    if(raw===null)return;const amount=parseMoney(raw);if(!amount)return toast('Số tiền không hợp lệ');
    if(reason.trim()===String(h.reason||'').trim()&&amount===Number(h.amount_added||0))return toast('Không có thay đổi');
    if(!confirm(`Xác nhận chỉnh khoản cũ?\n\nTrước: ${h.reason} · ${money(h.amount_added)}\nSau: ${reason.trim()} · ${money(amount)}\n\nTổng công nợ và các mốc trước/sau sẽ tự tính lại.`))return;
    try{
      await rest('rpc/edit_customer_debt_addition',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({p_history_id:String(historyId),p_reason:reason.trim(),p_amount:amount,p_employee:currentEmployee()})});
      expandedDebts.add(String(h.debt_id));
      await refreshDebts();toast('Đã chỉnh khoản nợ cũ và lưu lịch sử');
    }catch(e){console.error(e);toast('Không chỉnh được khoản nợ');}
  }

  const baseRefreshDebts=typeof refreshDebts==='function'?refreshDebts:null;
  if(baseRefreshDebts){refreshDebts=async function(){await Promise.all([baseRefreshDebts(),loadDebtExtras()]);renderDebtActions();};}
  renderDebts=function(){renderDebtActions()};
  window.addMoreDebt=addMoreDebt;window.editInitialDebt=editInitialDebt;window.editAddition=editAddition;window.toggleDebt=toggleDebt;

  async function boot(){await loadDebtExtras();if(typeof debtRows!=='undefined'&&debtRows.length)renderDebtActions();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

(function(){
  let debtHistory=[];

  function historyFor(id){
    return debtHistory.filter(h=>String(h.debt_id)===String(id));
  }

  function renderHistory(d){
    const rows=historyFor(d.id);
    const initial=`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(d.created_at)} ${vnTime(d.created_at)}</b> · Nợ ban đầu: ${money(d.amount-(rows.reduce((s,h)=>s+Number(h.amount_added||0),0)))} · ${esc(d.reason||'')}</small></div>`;
    const added=rows.map(h=>`<div style="padding:7px 9px;border-radius:9px;background:#f7faf9;margin-top:6px"><small><b>${vnDate(h.created_at)} ${vnTime(h.created_at)}</b> · <b>+${money(h.amount_added)}</b> · ${esc(h.reason||'')} ${h.employee?`· ${esc(h.employee)}`:''}</small></div>`).join('');
    return `<div style="margin-top:8px"><small style="font-weight:900;color:#586663">LỊCH SỬ CÔNG NỢ</small>${initial}${added}</div>`;
  }

  function renderDebtActions(){
    if(!document.getElementById('debtList'))return;
    const total=debtRows.reduce((a,x)=>a+Number(x.amount||0),0);
    document.getElementById('debtTotal').textContent=money(total);
    document.getElementById('debtEmpty').classList.toggle('hidden',debtRows.length>0);
    document.getElementById('debtList').innerHTML=debtRows.map(d=>`<div class="row"><div class="row-main"><b>${esc(d.customer)} · ${money(d.amount)}</b><span>${esc(d.reason)} · ${esc(d.employee||'')} · ${esc(d.shift_name||'Ngoài ca')}</span><small>${vnDate(d.created_at)} ${vnTime(d.created_at)}</small>${renderHistory(d)}</div><div class="row-actions"><button class="btn secondary mini" type="button" data-debt-add="${esc(d.id)}">+ Cộng thêm nợ</button><button class="btn danger mini" type="button" data-debt-delete="${esc(d.id)}">Xóa</button></div></div>`).join('');
    document.querySelectorAll('[data-debt-add]').forEach(b=>b.onclick=()=>addMoreDebt(b.dataset.debtAdd));
    document.querySelectorAll('[data-debt-delete]').forEach(b=>b.onclick=()=>deleteDebt(b.dataset.debtDelete));
  }

  async function loadDebtHistory(){
    try{
      debtHistory=await rest('customer_debt_history?select=*&order=created_at.asc')||[];
    }catch(e){
      console.error(e);
      debtHistory=[];
    }
  }

  async function addMoreDebt(id){
    const d=debtRows.find(x=>String(x.id)===String(id));
    if(!d)return toast('Không tìm thấy khách nợ');

    const reason=prompt(`Cộng thêm nợ cho ${d.customer}\nĐang nợ: ${money(d.amount)}\n\nKhách nợ thêm khoản gì?`);
    if(reason===null)return;
    if(!reason.trim())return toast('Nhập nội dung khách nợ gì');

    const raw=prompt(`Nội dung: ${reason.trim()}\n\nNhập số tiền cộng thêm:`);
    if(raw===null)return;
    const extra=parseMoney(raw);
    if(!extra)return toast('Số tiền cộng thêm không hợp lệ');

    const next=Number(d.amount||0)+extra;
    const employee=currentEmployee();
    if(!confirm(`${d.customer}\nNợ thêm: ${reason.trim()}\nSố tiền: +${money(extra)}\nTổng mới: ${money(next)}\n\nXác nhận lưu công nợ?`))return;

    try{
      await rest('rpc/add_customer_debt_amount',{
        method:'POST',
        headers:{Prefer:'return=representation'},
        body:JSON.stringify({p_debt_id:String(id),p_reason:reason.trim(),p_amount:extra,p_employee:employee})
      });
      await refreshDebts();
      toast(`Đã cộng ${money(extra)} · ${reason.trim()}`);
    }catch(e){
      console.error(e);
      toast('Không cập nhật được công nợ');
    }
  }

  const baseRefreshDebts=typeof refreshDebts==='function'?refreshDebts:null;
  if(baseRefreshDebts){
    refreshDebts=async function(){
      await Promise.all([baseRefreshDebts(),loadDebtHistory()]);
      renderDebtActions();
    };
  }

  renderDebts=function(){renderDebtActions()};
  window.addMoreDebt=addMoreDebt;

  async function boot(){
    await loadDebtHistory();
    if(typeof debtRows!=='undefined'&&debtRows.length)renderDebtActions();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

(function(){
  function renderDebtActions(){
    if(!document.getElementById('debtList'))return;
    const total=debtRows.reduce((a,x)=>a+Number(x.amount||0),0);
    document.getElementById('debtTotal').textContent=money(total);
    document.getElementById('debtEmpty').classList.toggle('hidden',debtRows.length>0);
    document.getElementById('debtList').innerHTML=debtRows.map(d=>`<div class="row"><div class="row-main"><b>${esc(d.customer)} · ${money(d.amount)}</b><span>${esc(d.reason)} · ${esc(d.employee||'')} · ${esc(d.shift_name||'Ngoài ca')}</span><small>${vnDate(d.created_at)} ${vnTime(d.created_at)}</small></div><div class="row-actions"><button class="btn secondary mini" type="button" data-debt-add="${esc(d.id)}">+ Cộng thêm nợ</button><button class="btn danger mini" type="button" data-debt-delete="${esc(d.id)}">Xóa</button></div></div>`).join('');
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
      await rest(`customer_debts?id=eq.${encodeURIComponent(id)}`,{
        method:'PATCH',
        headers:{Prefer:'return=minimal'},
        body:JSON.stringify({amount:next})
      });
      await refreshDebts();
      toast(`Đã cộng thêm ${money(extra)} cho ${d.customer}`);
    }catch(e){
      console.error(e);
      toast('Không cập nhật được công nợ');
    }
  }

  const originalRenderDebts=typeof renderDebts==='function'?renderDebts:null;
  renderDebts=function(){renderDebtActions()};
  window.addMoreDebt=addMoreDebt;

  function boot(){if(typeof debtRows!=='undefined'&&debtRows.length)renderDebtActions();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

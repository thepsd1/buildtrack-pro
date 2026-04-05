/* Materials Page */
Pages.materials = async function () {
  const materials = await API.getMaterials();
  const el = document.createElement('div');
  el.className = 'fade-in';
  const totalCost = materials.reduce((s, m) => s + (m.quantity * m.unitCost), 0);
  el.innerHTML = `
    <div class="section-header">
      <div><h3>Material Tracker</h3><span class="description">${materials.length} items · Total: ${App.formatCurrency(totalCost)}</span></div>
      <div class="filter-bar">
        <select id="matFilterProject"><option value="">All Projects</option></select>
        <select id="matFilterStatus"><option value="">All Status</option><option value="requested">Requested</option><option value="approved">Approved</option><option value="ordered">Ordered</option><option value="delivered">Delivered</option><option value="used">Used</option></select>
        <button class="btn btn-primary" id="addMatBtn"><span class="material-icons-round">add</span> Request Material</button>
      </div>
    </div>
    <div class="table-wrapper"><table class="data-table"><thead><tr>
      <th>Material</th><th>Project</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>Supplier</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody id="matBody"></tbody></table></div>`;
  const projF = el.querySelector('#matFilterProject');
  App.projects.forEach(p => { projF.innerHTML += `<option value="${p.id}">${p.name}</option>`; });

  function render(list) {
    const tb = el.querySelector('#matBody');
    if (!list.length) { tb.innerHTML = '<tr><td colspan="8"><div class="empty-state"><span class="material-icons-round">inventory_2</span><h4>No materials</h4></div></td></tr>'; return; }
    tb.innerHTML = list.map(m => `<tr>
      <td class="td-primary">${m.name}</td><td>${m.projectName||'-'}</td>
      <td>${m.quantity} ${m.unit}</td><td>${App.formatCurrency(m.unitCost)}</td>
      <td style="font-weight:600">${App.formatCurrency(m.quantity*m.unitCost)}</td>
      <td>${m.supplier||'-'}</td><td>${App.badge(m.status)}</td>
      <td><div class="btn-group">
        <button class="btn btn-secondary btn-sm edit-mat" data-id="${m.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button>
        <button class="btn btn-danger btn-sm del-mat" data-id="${m.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button>
      </div></td></tr>`).join('');
    tb.querySelectorAll('.edit-mat').forEach(btn => btn.addEventListener('click', () => showMaterialForm(list.find(m => m.id === btn.dataset.id))));
    tb.querySelectorAll('.del-mat').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Delete?')) { await API.deleteMaterial(btn.dataset.id); App.toast('Deleted','success'); App.loadPage('materials'); }
    }));
  }
  render(materials);
  const applyF = async () => {
    const p = {}; const pv = el.querySelector('#matFilterProject').value; const sv = el.querySelector('#matFilterStatus').value;
    if (pv) p.projectId = pv; if (sv) p.status = sv;
    render(await API.getMaterials(p));
  };
  el.querySelector('#matFilterProject').addEventListener('change', applyF);
  el.querySelector('#matFilterStatus').addEventListener('change', applyF);
  el.querySelector('#addMatBtn').addEventListener('click', () => showMaterialForm());
  return el;
};

function showMaterialForm(m = null) {
  const isEdit = !!m;
  App.openModal(isEdit ? 'Edit Material' : 'Request Material', `
    <form id="matForm" class="form-grid">
      <div class="form-group"><label class="form-label">Material Name *</label><input class="form-input" name="name" value="${m?.name||''}" required></div>
      <div class="form-group"><label class="form-label">Project *</label>${App.projectSelect(m?.projectId)}</div>
      <div class="form-group"><label class="form-label">Quantity *</label><input class="form-input" name="quantity" type="number" value="${m?.quantity||''}" required></div>
      <div class="form-group"><label class="form-label">Unit *</label><input class="form-input" name="unit" value="${m?.unit||''}" placeholder="tons, bags, m³" required></div>
      <div class="form-group"><label class="form-label">Unit Cost (₹)</label><input class="form-input" name="unitCost" type="number" value="${m?.unitCost||0}"></div>
      <div class="form-group"><label class="form-label">Supplier</label><input class="form-input" name="supplier" value="${m?.supplier||''}"></div>
      <div class="form-group"><label class="form-label">Requested By</label><input class="form-input" name="requestedBy" value="${m?.requestedBy||''}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
        <option value="requested" ${m?.status==='requested'?'selected':''}>Requested</option>
        <option value="approved" ${m?.status==='approved'?'selected':''}>Approved</option>
        <option value="ordered" ${m?.status==='ordered'?'selected':''}>Ordered</option>
        <option value="delivered" ${m?.status==='delivered'?'selected':''}>Delivered</option>
        <option value="used" ${m?.status==='used'?'selected':''}>Used</option>
      </select></div>
      <div class="form-group full-width"><label class="form-label">Notes</label><textarea class="form-textarea" name="notes">${m?.notes||''}</textarea></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Update':'Submit'}</button>
      </div>
    </form>`);
  document.getElementById('matForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const data = App.getFormData('matForm');
    if (isEdit) await API.updateMaterial(m.id, data); else await API.createMaterial(data);
    App.closeModal(); App.toast(`Material ${isEdit?'updated':'requested'}`,'success'); App.loadPage('materials');
  });
}

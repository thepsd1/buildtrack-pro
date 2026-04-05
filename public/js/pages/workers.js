/* Workers Page */
Pages.workers = async function () {
  const workers = App.workers;
  const el = document.createElement('div');
  el.className = 'fade-in';
  el.innerHTML = `
    <div class="section-header">
      <div><h3>Workforce</h3><span class="description">${workers.length} workers registered</span></div>
      <button class="btn btn-primary" id="addWorkerBtn"><span class="material-icons-round">person_add</span> Add Worker</button>
    </div>
    <div class="table-wrapper"><table class="data-table"><thead><tr>
      <th>Worker</th><th>Role</th><th>Phone</th><th>Rate/hr</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody id="workersBody"></tbody></table></div>
  `;
  const tbody = el.querySelector('#workersBody');
  workers.forEach(w => {
    tbody.innerHTML += `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div class="worker-avatar" style="background:${App.avatarColor(w.name)};width:32px;height:32px;font-size:0.7rem">${App.initials(w.name)}</div>
        <span class="td-primary">${w.name}</span>
      </div></td>
      <td>${w.role}</td><td>${w.phone || '-'}</td>
      <td>${App.formatCurrency(w.hourlyRate)}</td><td>${App.badge(w.status)}</td>
      <td><div class="btn-group">
        <button class="btn btn-secondary btn-sm edit-worker" data-id="${w.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button>
        <button class="btn btn-danger btn-sm del-worker" data-id="${w.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button>
      </div></td></tr>`;
  });
  if (!workers.length) tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><span class="material-icons-round">engineering</span><h4>No workers</h4></div></td></tr>';

  el.querySelector('#addWorkerBtn').addEventListener('click', () => showWorkerForm());
  el.querySelectorAll('.edit-worker').forEach(btn => btn.addEventListener('click', () => {
    showWorkerForm(workers.find(w => w.id === btn.dataset.id));
  }));
  el.querySelectorAll('.del-worker').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Delete this worker?')) { await API.deleteWorker(btn.dataset.id); App.toast('Worker deleted','success'); App.loadPage('workers'); }
  }));
  return el;
};

function showWorkerForm(w = null) {
  const isEdit = !!w;
  App.openModal(isEdit ? 'Edit Worker' : 'Add Worker', `
    <form id="workerForm" class="form-grid">
      <div class="form-group"><label class="form-label">Name *</label><input class="form-input" name="name" value="${w?.name||''}" required></div>
      <div class="form-group"><label class="form-label">Role *</label><input class="form-input" name="role" value="${w?.role||''}" required></div>
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" name="phone" value="${w?.phone||''}"></div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" name="email" type="email" value="${w?.email||''}"></div>
      <div class="form-group"><label class="form-label">Hourly Rate (₹)</label><input class="form-input" name="hourlyRate" type="number" value="${w?.hourlyRate||0}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
        <option value="active" ${w?.status==='active'?'selected':''}>Active</option>
        <option value="inactive" ${w?.status==='inactive'?'selected':''}>Inactive</option>
      </select></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Update':'Add'} Worker</button>
      </div>
    </form>`);
  document.getElementById('workerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const data = App.getFormData('workerForm');
    if (isEdit) await API.updateWorker(w.id, data); else await API.createWorker(data);
    App.closeModal(); App.toast(`Worker ${isEdit?'updated':'added'}`,'success'); App.loadPage('workers');
  });
}

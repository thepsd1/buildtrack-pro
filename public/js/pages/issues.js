/* Issues Page */
Pages.issues = async function () {
  const issues = await API.getIssues();
  const el = document.createElement('div');
  el.className = 'fade-in';
  const openCount = issues.filter(i => i.status === 'open' || i.status === 'in-progress').length;
  el.innerHTML = `
    <div class="section-header">
      <div><h3>Site Issues</h3><span class="description">${issues.length} total · ${openCount} open</span></div>
      <div class="filter-bar">
        <select id="issFilterProject"><option value="">All Projects</option></select>
        <select id="issFilterStatus"><option value="">All Status</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
        <select id="issFilterSeverity"><option value="">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <button class="btn btn-primary" id="addIssBtn"><span class="material-icons-round">add</span> Report Issue</button>
      </div>
    </div>
    <div id="issContainer"></div>`;

  const projF = el.querySelector('#issFilterProject');
  App.projects.forEach(p => { projF.innerHTML += `<option value="${p.id}">${p.name}</option>`; });

  function render(list) {
    const c = el.querySelector('#issContainer');
    if (!list.length) { c.innerHTML = '<div class="empty-state"><span class="material-icons-round">check_circle</span><h4>No issues found</h4><p>Great! Everything looks good.</p></div>'; return; }
    c.innerHTML = list.map(i => `
      <div class="card" style="margin-bottom:12px;border-left:3px solid var(--accent-${i.severity==='critical'?'red':i.severity==='high'?'orange':i.severity==='medium'?'blue':'purple'})">
        <div class="card-header">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span class="card-title">${i.title}</span>
              ${App.badge(i.severity)} ${App.badge(i.status)}
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${i.projectName} · Reported: ${i.reportDate||'N/A'} by ${i.reportedBy||'N/A'}${i.assignedTo ? ' · Assigned: '+i.assignedTo : ''}</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm edit-iss" data-id="${i.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button>
            <button class="btn btn-danger btn-sm del-iss" data-id="${i.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button>
          </div>
        </div>
        ${i.description ? `<p style="font-size:0.82rem;color:var(--text-secondary)">${i.description}</p>` : ''}
        ${i.resolution ? `<div style="margin-top:8px;padding:8px 12px;background:var(--accent-green-glow);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--accent-green-light)"><strong>Resolution:</strong> ${i.resolution}</div>` : ''}
      </div>`).join('');
    c.querySelectorAll('.edit-iss').forEach(btn => btn.addEventListener('click', () => showIssueForm(list.find(i => i.id === btn.dataset.id))));
    c.querySelectorAll('.del-iss').forEach(btn => btn.addEventListener('click', async () => {
      if (confirm('Delete this issue?')) { await API.deleteIssue(btn.dataset.id); App.toast('Deleted','success'); App.loadPage('issues'); }
    }));
  }

  render(issues);
  const applyF = async () => {
    const p = {};
    const pv = el.querySelector('#issFilterProject').value;
    const sv = el.querySelector('#issFilterStatus').value;
    const sev = el.querySelector('#issFilterSeverity').value;
    if (pv) p.projectId = pv; if (sv) p.status = sv; if (sev) p.severity = sev;
    render(await API.getIssues(p));
  };
  el.querySelector('#issFilterProject').addEventListener('change', applyF);
  el.querySelector('#issFilterStatus').addEventListener('change', applyF);
  el.querySelector('#issFilterSeverity').addEventListener('change', applyF);
  el.querySelector('#addIssBtn').addEventListener('click', () => showIssueForm());
  return el;
};

function showIssueForm(i = null) {
  const isEdit = !!i;
  App.openModal(isEdit ? 'Edit Issue' : 'Report Issue', `
    <form id="issForm" class="form-grid">
      <div class="form-group full-width"><label class="form-label">Title *</label><input class="form-input" name="title" value="${i?.title||''}" required></div>
      <div class="form-group"><label class="form-label">Project *</label>${App.projectSelect(i?.projectId)}</div>
      <div class="form-group"><label class="form-label">Severity</label><select class="form-select" name="severity">
        <option value="low" ${i?.severity==='low'?'selected':''}>Low</option>
        <option value="medium" ${i?.severity==='medium'?'selected':''}>Medium</option>
        <option value="high" ${i?.severity==='high'?'selected':''}>High</option>
        <option value="critical" ${i?.severity==='critical'?'selected':''}>Critical</option>
      </select></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
        <option value="open" ${i?.status==='open'?'selected':''}>Open</option>
        <option value="in-progress" ${i?.status==='in-progress'?'selected':''}>In Progress</option>
        <option value="resolved" ${i?.status==='resolved'?'selected':''}>Resolved</option>
        <option value="closed" ${i?.status==='closed'?'selected':''}>Closed</option>
      </select></div>
      <div class="form-group"><label class="form-label">Reported By</label><input class="form-input" name="reportedBy" value="${i?.reportedBy||''}"></div>
      <div class="form-group"><label class="form-label">Assigned To</label><input class="form-input" name="assignedTo" value="${i?.assignedTo||''}"></div>
      <div class="form-group full-width"><label class="form-label">Description</label><textarea class="form-textarea" name="description">${i?.description||''}</textarea></div>
      <div class="form-group full-width"><label class="form-label">Resolution</label><textarea class="form-textarea" name="resolution" style="min-height:60px">${i?.resolution||''}</textarea></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit?'Update':'Report'} Issue</button>
      </div>
    </form>`);
  document.getElementById('issForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const data = App.getFormData('issForm');
    if (isEdit) await API.updateIssue(i.id, data); else await API.createIssue(data);
    App.closeModal(); App.toast(`Issue ${isEdit?'updated':'reported'}`,'success'); App.loadPage('issues');
  });
}

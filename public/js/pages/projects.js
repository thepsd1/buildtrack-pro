/* Projects Page */
Pages.projects = async function () {
  const projects = App.projects;
  const el = document.createElement('div');
  el.className = 'fade-in';

  el.innerHTML = `
    <div class="section-header">
      <div><h3>All Projects</h3><span class="description">${projects.length} projects total</span></div>
      <button class="btn btn-primary" id="addProjectBtn"><span class="material-icons-round">add</span> New Project</button>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead><tr>
          <th>Project</th><th>Location</th><th>Client</th><th>Status</th><th>Tasks</th><th>Issues</th><th>Budget</th><th>Actions</th>
        </tr></thead>
        <tbody id="projectsBody"></tbody>
      </table>
    </div>
  `;

  const tbody = el.querySelector('#projectsBody');
  projects.forEach(p => {
    const pct = p.taskCount ? Math.round((p.completedTasks / p.taskCount) * 100) : 0;
    tbody.innerHTML += `<tr>
      <td class="td-primary">${p.name}</td>
      <td>${p.location || '-'}</td>
      <td>${p.client || '-'}</td>
      <td>${App.badge(p.status)}</td>
      <td><div style="display:flex;align-items:center;gap:8px"><span>${p.completedTasks}/${p.taskCount}</span><div class="progress-bar" style="width:60px"><div class="progress-fill green" style="width:${pct}%"></div></div></div></td>
      <td>${p.openIssues > 0 ? `<span style="color:var(--accent-red)">${p.openIssues} open</span>` : '<span style="color:var(--text-muted)">0</span>'}</td>
      <td>${App.formatCurrency(p.budget)}</td>
      <td><div class="btn-group"><button class="btn btn-secondary btn-sm edit-project" data-id="${p.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button><button class="btn btn-danger btn-sm del-project" data-id="${p.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button></div></td>
    </tr>`;
  });

  if (!projects.length) tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><span class="material-icons-round">apartment</span><h4>No projects yet</h4><p>Create your first project</p></div></td></tr>';

  // Event handlers
  el.querySelector('#addProjectBtn').addEventListener('click', () => showProjectForm());
  el.querySelectorAll('.edit-project').forEach(btn => btn.addEventListener('click', async () => {
    const p = await API.getProject(btn.dataset.id);
    showProjectForm(p);
  }));
  el.querySelectorAll('.del-project').forEach(btn => btn.addEventListener('click', async () => {
    if (confirm('Delete this project and all related data?')) {
      await API.deleteProject(btn.dataset.id);
      App.toast('Project deleted', 'success');
      App.loadPage('projects');
    }
  }));
  return el;
};

function showProjectForm(p = null) {
  const isEdit = !!p;
  App.openModal(isEdit ? 'Edit Project' : 'New Project', `
    <form id="projectForm" class="form-grid">
      <div class="form-group"><label class="form-label">Project Name *</label><input class="form-input" name="name" value="${p?.name || ''}" required></div>
      <div class="form-group"><label class="form-label">Location</label><input class="form-input" name="location" value="${p?.location || ''}"></div>
      <div class="form-group"><label class="form-label">Client</label><input class="form-input" name="client" value="${p?.client || ''}"></div>
      <div class="form-group"><label class="form-label">Budget (₹)</label><input class="form-input" name="budget" type="number" value="${p?.budget || 0}"></div>
      <div class="form-group"><label class="form-label">Start Date</label><input class="form-input" name="startDate" type="date" value="${p?.startDate || ''}"></div>
      <div class="form-group"><label class="form-label">End Date</label><input class="form-input" name="endDate" type="date" value="${p?.endDate || ''}"></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
        <option value="active" ${p?.status==='active'?'selected':''}>Active</option>
        <option value="on-hold" ${p?.status==='on-hold'?'selected':''}>On Hold</option>
        <option value="completed" ${p?.status==='completed'?'selected':''}>Completed</option>
        <option value="cancelled" ${p?.status==='cancelled'?'selected':''}>Cancelled</option>
      </select></div>
      <div class="form-group full-width"><label class="form-label">Description</label><textarea class="form-textarea" name="description">${p?.description || ''}</textarea></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Project</button>
      </div>
    </form>
  `);
  document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = App.getFormData('projectForm');
    if (isEdit) await API.updateProject(p.id, data);
    else await API.createProject(data);
    App.closeModal();
    App.toast(`Project ${isEdit ? 'updated' : 'created'}`, 'success');
    App.loadPage('projects');
  });
}

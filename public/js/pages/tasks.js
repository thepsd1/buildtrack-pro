/* Tasks Page */
Pages.tasks = async function () {
  const tasks = await API.getTasks();
  const el = document.createElement('div');
  el.className = 'fade-in';

  el.innerHTML = `
    <div class="section-header">
      <div><h3>Task Board</h3><span class="description">${tasks.length} tasks total</span></div>
      <div class="filter-bar">
        <select id="taskFilterProject"><option value="">All Projects</option></select>
        <select id="taskFilterStatus"><option value="">All Status</option><option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select>
        <button class="btn btn-primary" id="addTaskBtn"><span class="material-icons-round">add</span> New Task</button>
      </div>
    </div>
    <div class="task-cards" id="taskCards"></div>
  `;

  // Populate project filter
  const projFilter = el.querySelector('#taskFilterProject');
  App.projects.forEach(p => {
    projFilter.innerHTML += `<option value="${p.id}">${p.name}</option>`;
  });

  function renderTasks(filtered) {
    const container = el.querySelector('#taskCards');
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state"><span class="material-icons-round">task_alt</span><h4>No tasks found</h4></div>';
      return;
    }
    container.innerHTML = filtered.map(t => `
      <div class="task-card priority-${t.priority}" data-id="${t.id}">
        <div class="task-card-title">${t.title}</div>
        <div class="task-card-desc">${(t.description || '').substring(0, 100)}${(t.description||'').length > 100 ? '...' : ''}</div>
        <div style="display:flex;gap:6px;margin-bottom:8px">${App.badge(t.status)} ${App.badge(t.priority)}</div>
        <div class="task-card-footer">
          <div class="task-card-meta"><span class="material-icons-round">person</span>${t.workerName || 'Unassigned'}</div>
          <div class="task-card-meta"><span class="material-icons-round">calendar_today</span>${t.dueDate || 'No date'}</div>
        </div>
        <div class="task-card-footer" style="margin-top:6px"><span style="font-size:0.72rem;color:var(--text-muted)">${t.projectName || ''}</span>
          <div class="btn-group"><button class="btn btn-secondary btn-sm edit-task" data-id="${t.id}"><span class="material-icons-round" style="font-size:14px">edit</span></button><button class="btn btn-danger btn-sm del-task" data-id="${t.id}"><span class="material-icons-round" style="font-size:14px">delete</span></button></div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.edit-task').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = filtered.find(t => t.id === btn.dataset.id);
      showTaskForm(task);
    }));
    container.querySelectorAll('.del-task').forEach(btn => btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Delete this task?')) {
        await API.deleteTask(btn.dataset.id);
        App.toast('Task deleted', 'success');
        App.loadPage('tasks');
      }
    }));
  }

  renderTasks(tasks);

  // Filters
  const applyFilters = async () => {
    const params = {};
    const pv = el.querySelector('#taskFilterProject').value;
    const sv = el.querySelector('#taskFilterStatus').value;
    if (pv) params.projectId = pv;
    if (sv) params.status = sv;
    const filtered = await API.getTasks(params);
    renderTasks(filtered);
  };
  el.querySelector('#taskFilterProject').addEventListener('change', applyFilters);
  el.querySelector('#taskFilterStatus').addEventListener('change', applyFilters);

  el.querySelector('#addTaskBtn').addEventListener('click', () => showTaskForm());
  return el;
};

function showTaskForm(t = null) {
  const isEdit = !!t;
  App.openModal(isEdit ? 'Edit Task' : 'New Task', `
    <form id="taskForm" class="form-grid">
      <div class="form-group full-width"><label class="form-label">Title *</label><input class="form-input" name="title" value="${t?.title || ''}" required></div>
      <div class="form-group"><label class="form-label">Project *</label>${App.projectSelect(t?.projectId)}</div>
      <div class="form-group"><label class="form-label">Assigned To</label>${App.workerSelect(t?.assignedTo)}</div>
      <div class="form-group"><label class="form-label">Priority</label><select class="form-select" name="priority">
        <option value="low" ${t?.priority==='low'?'selected':''}>Low</option>
        <option value="medium" ${t?.priority==='medium'?'selected':''}>Medium</option>
        <option value="high" ${t?.priority==='high'?'selected':''}>High</option>
        <option value="critical" ${t?.priority==='critical'?'selected':''}>Critical</option>
      </select></div>
      <div class="form-group"><label class="form-label">Status</label><select class="form-select" name="status">
        <option value="pending" ${t?.status==='pending'?'selected':''}>Pending</option>
        <option value="in-progress" ${t?.status==='in-progress'?'selected':''}>In Progress</option>
        <option value="completed" ${t?.status==='completed'?'selected':''}>Completed</option>
        <option value="blocked" ${t?.status==='blocked'?'selected':''}>Blocked</option>
      </select></div>
      <div class="form-group"><label class="form-label">Due Date</label><input class="form-input" name="dueDate" type="date" value="${t?.dueDate || ''}"></div>
      <div class="form-group full-width"><label class="form-label">Description</label><textarea class="form-textarea" name="description">${t?.description || ''}</textarea></div>
      <div class="form-actions full-width">
        <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Task</button>
      </div>
    </form>
  `);
  document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = App.getFormData('taskForm');
    if (isEdit) await API.updateTask(t.id, data);
    else await API.createTask(data);
    App.closeModal();
    App.toast(`Task ${isEdit ? 'updated' : 'created'}`, 'success');
    App.loadPage('tasks');
  });
}
